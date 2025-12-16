import { Module, ModuleMetadata, Provider, Type } from '@nestjs/common';

// Cached references to optional dependencies
let _TypeOrmModule: typeof import('@nestjs/typeorm').TypeOrmModule | undefined;
let _getRepositoryToken: typeof import('@nestjs/typeorm').getRepositoryToken | undefined;
let _BullModule: typeof import('@nestjs/bullmq').BullModule | undefined;

/**
 * Configure optional dependencies for CreateModule.
 * Call this once at app startup before any modules are loaded.
 */
export function configureCreateModule(config: {
  typeorm?: typeof import('@nestjs/typeorm');
  bullmq?: typeof import('@nestjs/bullmq');
}) {
  if (config.typeorm) {
    _TypeOrmModule = config.typeorm.TypeOrmModule;
    _getRepositoryToken = config.typeorm.getRepositoryToken;
  }
  if (config.bullmq) {
    _BullModule = config.bullmq.BullModule;
  }
}

function getTypeOrm() {
  if (!_TypeOrmModule || !_getRepositoryToken) {
    throw new Error(
      `CreateModule: To use 'entities', configure TypeORM first:\n` +
        `  import { configureCreateModule } from '@dl-tech/nestjs-core';\n` +
        `  import * as typeorm from '@nestjs/typeorm';\n` +
        `  configureCreateModule({ typeorm });`,
    );
  }
  return { TypeOrmModule: _TypeOrmModule, getRepositoryToken: _getRepositoryToken };
}

function getBullMQ() {
  if (!_BullModule) {
    throw new Error(
      `CreateModule: To use 'processors', configure BullMQ first:\n` +
        `  import { configureCreateModule } from '@dl-tech/nestjs-core';\n` +
        `  import * as bullmq from '@nestjs/bullmq';\n` +
        `  configureCreateModule({ bullmq });`,
    );
  }
  return { BullModule: _BullModule };
}

type Metadata = Required<ModuleMetadata>;

/**
 * Entity class constructor or EntitySchema-like object.
 * Covers both patterns without requiring @nestjs/typeorm types.
 */
export type EntityTarget =
  | (new (...args: any[]) => any) // Class-based entity
  | { name: string; options?: unknown }; // EntitySchema

export interface EntityOptions<T extends EntityTarget = EntityTarget> {
  entity: T;
  repoClass: Type;
}

export interface ICreateModuleOptions {
  /** Standard NestJS imports */
  imports?: Metadata['imports'];

  /** Imports that are automatically re-exported */
  modules?: Metadata['imports'];

  /** Standard NestJS controllers */
  controllers?: Metadata['controllers'];

  /** Providers (not exported) */
  providers?: Metadata['providers'];

  /** TypeORM entities with repository classes (requires @nestjs/typeorm) */
  entities?: EntityOptions[];

  /** WebSocket gateways (not exported) */
  gateways?: Metadata['providers'];

  /** Services (automatically exported) */
  services?: Metadata['providers'];

  /** Event handlers (not exported) */
  events?: Metadata['providers'];

  /** Cron jobs (not exported) */
  cronJobs?: Metadata['providers'];

  /** BullMQ processors (requires @nestjs/bullmq) */
  processors?: Type[];

  /** Initialization provider (not exported) */
  init?: Provider;

  /** Standard NestJS exports */
  exports?: Metadata['exports'];
}

type RequiredOptions = Required<ICreateModuleOptions>;

export const CreateModule = (options: ICreateModuleOptions) =>
  Module(new ModuleBuilder(options).toMetadata());

class ModuleBuilder {
  private _imports: Metadata['imports'] = [];
  private _controllers: Metadata['controllers'] = [];
  private _providers: Metadata['providers'] = [];
  private _exports: Metadata['exports'] = [];

  constructor(private readonly options: ICreateModuleOptions) {
    const keys = Object.keys(options) as (keyof ICreateModuleOptions)[];
    keys.forEach((key) => {
      const value = options[key];
      if (!value) return;

      const setter = Object.getOwnPropertyDescriptor(ModuleBuilder.prototype, key)?.set;

      if (setter) {
        setter.call(this, value);
      }
    });
  }

  set exports(value: RequiredOptions['exports']) {
    this._exports.push(...value);
  }

  set imports(value: RequiredOptions['imports']) {
    this._imports.push(...value);
  }

  set controllers(value: RequiredOptions['controllers']) {
    this._controllers.push(...value);
  }

  set providers(value: RequiredOptions['providers']) {
    this._providers.push(...value);
  }

  set entities(value: RequiredOptions['entities']) {
    const { TypeOrmModule, getRepositoryToken } = getTypeOrm();

    value.forEach((entity) => {
      this._imports.push(TypeOrmModule.forFeature([entity.entity as any]));
      this._providers.push({
        provide: entity.repoClass,
        useExisting: getRepositoryToken(entity.entity as any),
      });
    });
  }

  set gateways(value: RequiredOptions['gateways']) {
    this._providers.push(...value);
  }

  set services(value: RequiredOptions['services']) {
    this._providers.push(...value);
    this._exports.push(...value);
  }

  set events(value: RequiredOptions['events']) {
    this._providers.push(...value);
  }

  set cronJobs(value: RequiredOptions['cronJobs']) {
    this._providers.push(...value);
  }

  set processors(value: RequiredOptions['processors']) {
    const { BullModule } = getBullMQ();

    this._imports.push(...value.map((type) => BullModule.registerQueue({ name: type.name })));
    this._providers.push(...value);
  }

  set init(value: RequiredOptions['init']) {
    this._providers.push(value);
  }

  set modules(value: RequiredOptions['modules']) {
    this._imports.push(...value);
    this._exports.push(...(value as Metadata['exports']));
  }

  toMetadata(): ModuleMetadata {
    return {
      imports: this._imports,
      controllers: this._controllers,
      exports: this._exports,
      providers: this._providers,
    };
  }
}
