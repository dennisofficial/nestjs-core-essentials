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
 */
function fromAsyncGenerator<T>(generator: AsyncGenerator<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    (async () => {
      try {
        for await (const value of generator) {
          subscriber.next(value);
        }
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    })();
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
      mergeMap((generator: AsyncGenerator<unknown>) => fromAsyncGenerator(generator)),
      // Wrap each yielded value in { data: value }
      map((data): MessageEvent => ({ data: data as string | object })),
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
