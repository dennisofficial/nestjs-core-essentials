import { type INestApplication, Logger, type LoggerService } from '@nestjs/common';

export interface ShutdownGuardOptions {
  /**
   * Hard deadline (ms) after a shutdown signal by which the process MUST be gone. The graceful path
   * (`app.enableShutdownHooks()` → lifecycle hooks → `http.Server.close()`) is given this long to finish
   * on its own; if it hasn't, the process is force-exited. Compute this per-environment in your bootstrap:
   * small in dev for a snappy `nest start --watch` restart, and your drain grace + a buffer in prod so the
   * graceful path always wins. Default `10_000`.
   */
  forceExitAfterMs?: number;
  /** Signals that trigger shutdown. Default `['SIGTERM', 'SIGINT']`. */
  signals?: NodeJS.Signals[];
  /**
   * Tear down lingering keep-alive / streaming sockets so `http.Server.close()` can actually resolve.
   * This is the usual reason a Nest app hangs on shutdown: long-lived responses (Server-Sent Events,
   * upgraded sockets) never end on their own, so `close()` — and therefore the process — waits forever.
   * Closing them lets the graceful shutdown run to completion; clients simply reconnect. Default `true`.
   */
  closeConnections?: boolean;
  /** Exit code used by the force-exit backstop. Default `0`. */
  exitCode?: number;
  /** Logger for the two diagnostic lines. Defaults to a Nest `Logger('ShutdownGuard')`. */
  logger?: Pick<LoggerService, 'log' | 'warn'>;
}

/**
 * Make SIGTERM/SIGINT reliably exit a Nest app within a bounded time.
 *
 * `app.enableShutdownHooks()` runs the lifecycle hooks and then calls `http.Server.close()`, but `close()`
 * resolves only once EVERY socket is gone. Any long-lived response — a Server-Sent Events stream, a chunked
 * download, an upgraded socket — keeps a connection open indefinitely, so the server never closes, the event
 * loop never empties, and the process hangs. Under `nest start --watch` this wedges every restart: the old
 * process never exits, so a new one can't spawn until it is `kill -9`ed.
 *
 * This guard, installed once after `app.listen()`, does two things on a shutdown signal:
 *  1. (optional, on by default) closes idle + all open connections so `server.close()` can complete and the
 *     graceful path — including `enableShutdownHooks()` drains and `onApplicationShutdown` cleanup — runs to
 *     the end. In-flight work that doesn't live on the socket (background jobs, queue consumers) is
 *     unaffected; clients reconnect.
 *  2. arms an `unref()`'d force-exit timer as a hard backstop in case anything else still pins the loop. It
 *     is `unref()`'d so it NEVER keeps the process alive on its own — it fires only if the process is
 *     otherwise stuck.
 *
 * Still call `app.enableShutdownHooks()` for graceful cleanup; this guard complements it, it does not
 * replace it.
 *
 * @example
 * ```ts
 * await app.listen(port);
 * const isProd = process.env.NODE_ENV === 'production';
 * installShutdownGuard(app, { forceExitAfterMs: isProd ? drainGraceMs + 15_000 : 4_000 });
 * ```
 */
export function installShutdownGuard(app: INestApplication, options: ShutdownGuardOptions = {}): void {
  const {
    forceExitAfterMs = 10_000,
    signals = ['SIGTERM', 'SIGINT'],
    closeConnections = true,
    exitCode = 0,
    logger = new Logger('ShutdownGuard'),
  } = options;

  // `getHttpServer()` is typed `any`; narrow to just the connection-teardown methods we use (Node >= 18.2).
  // Microservice/non-HTTP apps return something without them — the optional chaining below no-ops safely.
  const server = app.getHttpServer() as {
    closeIdleConnections?: () => void;
    closeAllConnections?: () => void;
  } | null;

  let shuttingDown = false;
  const onSignal = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return; // ignore repeated signals
    shuttingDown = true;
    logger.log(`${signal} received — ensuring shutdown completes within ${forceExitAfterMs}ms.`);
    if (closeConnections && server) {
      server.closeIdleConnections?.();
      server.closeAllConnections?.();
    }
    setTimeout(() => {
      logger.warn(`Shutdown still pending ${forceExitAfterMs}ms after ${signal} — forcing exit.`);
      process.exit(exitCode);
    }, forceExitAfterMs).unref();
  };

  for (const signal of signals) process.on(signal, onSignal);
}
