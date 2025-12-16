import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Abstract base class for type-safe environment configuration.
 * Extend this class with your app's environment interface.
 *
 * @example
 * ```typescript
 * interface IEnvConfig {
 *   DATABASE_URL: string;
 *   PORT: number;
 * }
 *
 * @Injectable()
 * export class EnvService extends BaseEnvService<IEnvConfig> {}
 * ```
 */
@Injectable()
export abstract class BaseEnvService<T> extends ConfigService<T, true> {
  /**
   * Get an environment variable with full type safety.
   * @param propertyPath - The key of the environment variable
   * @returns The typed value of the environment variable
   */
  override get<K extends keyof T & string>(propertyPath: K): T[K] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.get(propertyPath as any, { infer: true }) as T[K];
  }
}
