import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  Injectable,
  MessageEvent,
  NestInterceptor,
  Sse,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

/**
 * Converts an AsyncGenerator to an Observable that emits each yielded value.
 *
 * On unsubscribe (e.g. the SSE client disconnects, Nest tears down the
 * subscription), the returned teardown flips `cancelled` and calls
 * `generator.return()`. That runs any `finally {}` inside the generator — which
 * is how a streaming handler aborts its upstream work (e.g. an
 * `AbortController` tailing BullMQ `QueueEvents`). Without this, a disconnected
 * client would leak the generator and its upstream listeners.
 */
function fromAsyncGenerator<T>(generator: AsyncGenerator<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    let cancelled = false;
    (async () => {
      try {
        for await (const value of generator) {
          if (cancelled) break;
          subscriber.next(value);
        }
        if (!cancelled) subscriber.complete();
      } catch (error) {
        if (!cancelled) subscriber.error(error);
      }
    })();
    return () => {
      cancelled = true;
      void generator.return(undefined as never);
    };
  });
}

/**
 * Interceptor that converts an AsyncGenerator into an Observable<MessageEvent>.
 * Each yielded value becomes the `data` property of an SSE MessageEvent.
 */
@Injectable()
class SseGeneratorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<MessageEvent> {
    return next.handle().pipe(
      // The handler returns an AsyncGenerator - flatten it into individual values
      mergeMap((generator: AsyncGenerator) => fromAsyncGenerator(generator)),
      // Wrap each yielded value in { data: value }
      map(
        (data): MessageEvent => ({
          data: data as string | object,
          type: 'message',
          id: Date.now().toString(),
        }),
      ),
    );
  }
}

/**
 * Decorator for SSE endpoints that use async generators.
 * Automatically converts AsyncGenerator<T> to Observable<MessageEvent>.
 *
 * @example
 * ```typescript
 * @SseGenerator()
 * async *streamSummary(@Param('id') id: string): AsyncGenerator<{ summary: string }> {
 *   for await (const chunk of this.chain.stream(input)) {
 *     yield chunk; // automatically becomes { data: chunk }
 *   }
 * }
 * ```
 */
export const SseGenerator = (path?: string) =>
  applyDecorators(Sse(path), UseInterceptors(SseGeneratorInterceptor));
