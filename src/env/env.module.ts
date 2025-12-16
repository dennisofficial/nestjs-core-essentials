import { DynamicModule, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BaseEnvService } from './env.service';

/**
 * Options for configuring the EnvModule.
 */
export interface EnvModuleOptions {
  /**
   * The EnvService class that extends BaseEnvService<T>.
   * This will be provided and exported by the module.
   */
  envService: Type<BaseEnvService<unknown>>;

  /**
   * Optional Joi validation schema for environment variables.
   * Validation is skipped in test environment (NODE_ENV=test).
   */
  validationSchema?: unknown;

  /**
   * Whether to load from .env file. Default: false (ignoreEnvFile: true)
   */
  loadEnvFile?: boolean;
}

/**
 * Dynamic module for type-safe environment configuration.
 *
 * @example
 * ```typescript
 * // env.service.ts
 * @Injectable()
 * export class EnvService extends BaseEnvService<IEnvConfig> {}
 *
 * // app.module.ts
 * @Module({
 *   imports: [
 *     EnvModule.forRoot({
 *       envService: EnvService,
 *       validationSchema: envConfigValidation,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class EnvModule {
  static forRoot(options: EnvModuleOptions): DynamicModule {
    const { envService, validationSchema, loadEnvFile = false } = options;

    return {
      module: EnvModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          validationSchema: process.env.NODE_ENV !== 'test' ? validationSchema : undefined,
          ignoreEnvFile: !loadEnvFile,
        }),
      ],
      providers: [envService],
      exports: [envService],
    };
  }
}
