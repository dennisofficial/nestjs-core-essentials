// noinspection JSUnusedGlobalSymbols

import { Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { BullModule, WorkerHost } from '@nestjs/bullmq';
import { Model, Schema } from 'mongoose';
import { DiscriminatorOptions, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { isDefined } from 'class-validator';
import { AbstractType } from '../types';
import { MongoModelRepo } from '../types/mongo-model-repo';

interface CollectionConfig extends CreateCollectionConfig {
  connectionName?: string;
  repoClass: AbstractType<MongoModelRepo<any>>;
}

export const CreateModule = (options: ICreateModuleOptions) =>
  Module(new ModuleBuilder(options).toMetadata());

type Metadata = Required<ModuleMetadata>;

export interface CreateCollectionConfig {
  name: string;
  schema: Schema;
  discriminators?: DiscriminatorOptions[];
}

export interface ICreateModuleOptions {
  // Standard NestJS Exports
  imports?: Metadata['imports'];

  // Standard NestJS Imports, with Auto Export
  modules?: Metadata['imports'];

  // Auto create MongoDB Collection
  collection?: CollectionConfig | CollectionConfig[];

  // Standard NestJS Controllers
  controllers?: Metadata['controllers'];

  // For Organization, Will be treated as non-exported Provider
  providers?: Metadata['providers'];

  // For Organization, Will be treated as exported Provider
  chains?: Metadata['providers'];

  // For Organization, Will be treated as non-exported Provider
  gateways?: Metadata['providers'];

  // Services will be auto exported
  services?: Metadata['providers'];

  // For Organization, Will be treated as non-exported Provider
  events?: Metadata['providers'];

  // For Organization, Will be treated as non-exported Provider
  cronJobs?: Metadata['providers'];

  // Auto Create BullMQ Processes
  processors?: Type<WorkerHost>[];

  // For Organization, Will be treated as non-exported Provider
  init?: Provider;

  // Standard NestJS Exports
  exports?: Metadata['exports'];
}

type RequiredOptions = Required<ICreateModuleOptions>;

type ModuleBuilderHandler = {
  [K in keyof RequiredOptions]: RequiredOptions[K];
};

class ModuleBuilder implements ModuleBuilderHandler {
  private _imports: Metadata['imports'] = [];
  private _controllers: Metadata['controllers'] = [];
  private _providers: Metadata['providers'] = [];
  private _exports: Metadata['exports'] = [];

  constructor(private readonly options: ICreateModuleOptions) {
    Object.keys(options).forEach((key: keyof ICreateModuleOptions) => {
      const value = options[key];
      if (!value) {
        return;
      }
      if (key in this) {
        this[key] = value as any;
      }
    });
  }

  set exports(value: RequiredOptions['exports']) {
    this._exports.push(...value);
  }

  set imports(value: RequiredOptions['imports']) {
    this._imports.push(...value);
  }

  set collection(options: RequiredOptions['collection']) {
    const handleCollection = (options: CollectionConfig) => {
      const module = MongooseModule.forFeatureAsync(
        [
          {
            name: options.name,
            useFactory: async () => {
              return options.schema;
            },
            discriminators: options.discriminators,
          },
        ],
        options.connectionName,
      );

      this._providers.push({
        provide: `${options.name}_REINDEX`,
        inject: [getModelToken(options.name, options.connectionName)],
        useFactory: async (model: Model<any>) => {
          try {
            // Get the current indexes in the collection
            const currentIndexes = await model.collection.indexes();
            const currentIndexMap = new Map(currentIndexes.map((index) => [index.name, index]));

            // Exclude the mandatory `_id` index from the current indexes
            currentIndexMap.delete('_id_');

            // Get the desired indexes from the model schema
            const desiredIndexes = (model.schema as Schema).indexes();
            const desiredIndexMap = new Map<string, any>(
              desiredIndexes.map(([fields, options]) => {
                const indexName =
                  options?.name ||
                  Object.entries(fields)
                    .map((pair) => pair.join('_'))
                    .join('_');
                return [indexName, { fields, options }];
              }),
            );

            // Compare indexes and decide what to do
            for (const [name, { fields, options }] of desiredIndexMap) {
              const currentIndex = currentIndexMap.get(name);

              if (!currentIndex) {
                // Index does not exist, create it
                console.log(`Creating new index: ${name}`);
                await model.collection.createIndex(fields, options);
              }
            }

            // Drop indexes that are no longer needed
            for (const name of Array.from(currentIndexMap.keys()).filter(isDefined) as string[]) {
              if (!desiredIndexMap.has(name)) {
                console.log(`Dropping index: ${name}`);
                await model.collection.dropIndex(name);
              }
            }

            await model.syncIndexes();
          } catch (e) {}
        },
      });

      this._imports.push(module);
      this._providers.push({
        provide: options.repoClass,
        useExisting: getModelToken(options.name, options.connectionName),
      });
      this._exports.push(...[module, options.repoClass]);
    };

    if (Array.isArray(options)) {
      options.forEach(handleCollection);
    } else {
      handleCollection(options);
    }
  }

  set controllers(value: RequiredOptions['controllers']) {
    this._controllers.push(...value);
  }

  set providers(value: RequiredOptions['providers']) {
    this._providers.push(...value);
  }

  set chains(value: RequiredOptions['providers']) {
    this._providers.push(...value);
    this._exports.push(...value);
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
    if (value) {
      this._imports.push(...value.map((type) => BullModule.registerQueue({ name: type.name })));
      this._providers.push(...value);
    }
  }

  set init(value: RequiredOptions['init']) {
    this._providers.push(value);
  }

  set modules(value: RequiredOptions['modules']) {
    this._imports.push(...value);
    // @ts-ignore
    this._exports.push(...value);
  }

  toMetadata = (): ModuleMetadata => ({
    imports: this._imports,
    controllers: this._controllers,
    exports: this._exports,
    providers: this._providers,
  });
}
