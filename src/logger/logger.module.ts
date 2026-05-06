import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './logger.interceptor';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    LoggerService,
    {
      provide: 'pretty-ms',
      useFactory: async () => await import('pretty-ms'),
    },
    {
      useClass: LoggerInterceptor,
      provide: APP_INTERCEPTOR,
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
