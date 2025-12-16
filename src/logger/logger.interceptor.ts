import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, finalize, Observable } from 'rxjs';
import { Response } from 'express';
import { SKIP_REQUEST_LOGGING_METADATA } from './metadata';
import { LoggerResponse } from './logger.types';
import { LoggerService } from './logger.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    private readonly reflect: Reflector,
    private readonly loggerService: LoggerService,
    @Inject('pretty-ms')
    private readonly prettyMs: typeof import('pretty-ms'),
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Should Skip?
    const should_skip = this.reflect.getAllAndOverride<boolean>(SKIP_REQUEST_LOGGING_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (should_skip) {
      return next.handle();
    }

    const requestUuid = this.loggerService.addRequest();

    const logger = new Logger(context.getClass().name);
    const config: LoggerResponse = { is_set: false, start_time: Date.now() };
    const response = context.switchToHttp().getResponse<Response>();

    await this.logResponse(response, config, logger, true);

    return next.handle().pipe(
      // We need to catch an error an store the status, and message.
      // When NestJS throws an error. The request will only have the generic status message,
      // While this will capture the exception which has our custom messages.
      catchError((err) => {
        if (err instanceof HttpException) {
          config.is_set = true;
          config.status = err.getStatus();
          config.message = err.message;
          console.log(err.getResponse());
        }
        // You need to throw the error, so the next handler in NestJS can use the error.
        // This is just to catch the error for logging.
        throw err;
      }),
      finalize(async () => {
        // Some cases the response could be closed, so this will check the status,
        // and attach a handler if needed.

        if (response.closed) {
          await this.logResponse(response, config, logger);
          this.loggerService.removeRequest(requestUuid);
          return;
        }

        response.on('close', async () => {
          await this.logResponse(response, config, logger);
          this.loggerService.removeRequest(requestUuid);
        });
      }),
    );
  }

  private logResponse = async (
    response: Response,
    config: LoggerResponse,
    logger: Logger,
    is_start = false,
  ) => {
    if (!config.is_set) {
      config.status = response.statusCode;
      config.message = response.statusMessage;
    }

    const buffer: string[] = [];

    const execution_time = Date.now() - config.start_time;

    const ip = response.req.socket.remoteAddress ?? 'NO_IP';
    const ipv4 = ip.includes(':') ? ip.split(':').pop()! : ip;

    buffer.push(ipv4);
    buffer.push(` {${response.req.method}, ${response.req.path}} `);
    if (is_start) {
      buffer.push(`Requested`);
    } else {
      buffer.push(`${config.status}: ${config.message}`);
      buffer.push(` - ${this.prettyMs.default(execution_time)}`);
    }

    logger.verbose(buffer.join(''));
  };
}
