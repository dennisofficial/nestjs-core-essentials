import mongodb, { AggregateOptions } from 'mongodb';
import {
  Aggregate,
  AnyBulkWriteOperation,
  AnyKeys,
  AnyObject,
  CastError,
  Collection,
  Connection,
  CreateOptions,
  Document,
  Error,
  GetLeanResultType,
  HydratedDocument,
  HydrateOptions,
  InferId,
  InsertManyOptions,
  MergeType,
  Model,
  ModifyResult,
  Mongoose,
  MongooseBaseQueryOptions,
  MongooseBulkSaveOptions,
  MongooseBulkWriteOptions,
  MongooseUpdateQueryOptions,
  pathsToSkip,
  PathsToValidate,
  PipelineStage,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  QueryWithHelpers,
  Require_id,
  ReturnsNewDoc,
  SaveOptions,
  Schema,
  SchemaOptions,
  SearchIndexDescription,
  Unpacked,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
  WithLevel1NestedPaths,
  WithoutUndefined,
} from 'mongoose';

export abstract class MongoModelRepo<
  TModel,
  THydratedDocument = HydratedDocument<TModel>,
  TRawDocType = TModel,
  TQueryHelpers = {},
  TInstanceMethods = {},
  TVirtuals = {},
  THydratedDocumentType = HydratedDocument<
    TRawDocType,
    TVirtuals & TInstanceMethods,
    TQueryHelpers
  > &
    THydratedDocument,
> extends Model<TRawDocType> {
  abstract new<DocType = Partial<TRawDocType>>(
    doc?: DocType,
    fields?: any | null,
    options?: boolean | AnyObject,
  ): THydratedDocumentType;

  abstract aggregate<R = any>(
    pipeline?: PipelineStage[],
    options?: AggregateOptions,
  ): Aggregate<Array<R>>;
  abstract aggregate<R = any>(pipeline: PipelineStage[]): Aggregate<Array<R>>;

  /** Base Mongoose instance the model uses. */
  base: Mongoose;

  /**
   * If this is a discriminator model, `baseModelName` is the name of
   * the base model.
   */
  baseModelName: string | undefined;

  /* Cast the given POJO to the model's schema */
  abstract castObject(obj: AnyObject, options?: { ignoreCastErrors?: boolean }): TRawDocType;

  /* Apply defaults to the given document or POJO. */
  abstract applyDefaults(obj: AnyObject): AnyObject;
  abstract applyDefaults(obj: TRawDocType): TRawDocType;

  /* Apply virtuals to the given POJO. */
  abstract applyVirtuals(obj: AnyObject, virtalsToApply?: string[]): AnyObject;

  /**
   * Apply this model's timestamps to a given POJO, including subdocument timestamps
   */
  abstract applyTimestamps(
    obj: AnyObject,
    options?: { isUpdate?: boolean; currentTime?: () => Date },
  ): AnyObject;

  /**
   * Sends multiple `insertOne`, `updateOne`, `updateMany`, `replaceOne`,
   * `deleteOne`, and/or `deleteMany` operations to the MongoDB server in one
   * command. This is faster than sending multiple independent operations (e.g.
   * if you use `create()`) because with `bulkWrite()` there is only one network
   * round trip to the MongoDB server.
   */
  abstract bulkWrite<DocContents = TRawDocType>(
    writes: Array<
      AnyBulkWriteOperation<
        DocContents extends Document ? any : DocContents extends {} ? DocContents : any
      >
    >,
    options: MongooseBulkWriteOptions & { ordered: false },
  ): Promise<
    mongodb.BulkWriteResult & {
      mongoose?: { validationErrors: Error[]; results: Array<Error | mongodb.WriteError | null> };
    }
  >;
  abstract bulkWrite<DocContents = TRawDocType>(
    writes: Array<
      AnyBulkWriteOperation<
        DocContents extends Document ? any : DocContents extends {} ? DocContents : any
      >
    >,
    options?: MongooseBulkWriteOptions,
  ): Promise<mongodb.BulkWriteResult>;

  /**
   * Sends multiple `save()` calls in a single `bulkWrite()`. This is faster than
   * sending multiple `save()` calls because with `bulkSave()` there is only one
   * network round trip to the MongoDB server.
   */
  abstract bulkSave(
    documents: Array<Document>,
    options?: MongooseBulkSaveOptions,
  ): Promise<mongodb.BulkWriteResult>;

  /** Collection the model uses. */
  collection: Collection;

  /** Creates a `countDocuments` query: counts the number of documents that match `filter`. */
  abstract countDocuments(
    filter?: QueryFilter<TRawDocType>,
    options?: (mongodb.CountOptions & MongooseBaseQueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    number,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'countDocuments',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a new document or documents */
  abstract create<DocContents = AnyKeys<TRawDocType>>(
    docs: Array<TRawDocType | DocContents>,
    options: CreateOptions & { aggregateErrors: true },
  ): Promise<(THydratedDocumentType | Error)[]>;
  abstract create<DocContents = AnyKeys<TRawDocType>>(
    docs: Array<TRawDocType | DocContents>,
    options?: CreateOptions,
  ): Promise<THydratedDocumentType[]>;
  abstract create<DocContents = AnyKeys<TRawDocType>>(
    doc: DocContents | TRawDocType,
  ): Promise<THydratedDocumentType>;
  abstract create<DocContents = AnyKeys<TRawDocType>>(
    ...docs: Array<TRawDocType | DocContents>
  ): Promise<THydratedDocumentType[]>;

  /**
   * Create the collection for this model. By default, if no indexes are specified,
   * mongoose will not create the collection for the model until any documents are
   * created. Use this method to create the collection explicitly.
   */
  abstract createCollection<T extends mongodb.Document>(
    options?: mongodb.CreateCollectionOptions & Pick<SchemaOptions, 'expires'>,
  ): Promise<mongodb.Collection<T>>;

  /**
   * Create an [Atlas search index](https://www.mongodb.com/docs/atlas/atlas-search/create-index/).
   * This function only works when connected to MongoDB Atlas.
   */
  abstract createSearchIndex(description: SearchIndexDescription): Promise<string>;

  /** Connection the model uses. */
  abstract db: Connection;

  /**
   * Deletes all of the documents that match `conditions` from the collection.
   * Behaves like `remove()`, but deletes all documents that match `conditions`
   * regardless of the `single` option.
   */
  abstract deleteMany(
    filter?: QueryFilter<TRawDocType>,
    options?: (mongodb.DeleteOptions & MongooseBaseQueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    mongodb.DeleteResult,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'deleteMany',
    TInstanceMethods & TVirtuals
  >;
  abstract deleteMany(
    filter: QueryFilter<TRawDocType>,
  ): QueryWithHelpers<
    mongodb.DeleteResult,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'deleteMany',
    TInstanceMethods & TVirtuals
  >;

  /**
   * Deletes the first document that matches `conditions` from the collection.
   * Behaves like `remove()`, but deletes at most one document regardless of the
   * `single` option.
   */
  abstract deleteOne(
    filter?: QueryFilter<TRawDocType>,
    options?: (mongodb.DeleteOptions & MongooseBaseQueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    mongodb.DeleteResult,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'deleteOne',
    TInstanceMethods & TVirtuals
  >;
  abstract deleteOne(
    filter: QueryFilter<TRawDocType>,
  ): QueryWithHelpers<
    mongodb.DeleteResult,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'deleteOne',
    TInstanceMethods & TVirtuals
  >;

  /**
   * Delete an existing [Atlas search index](https://www.mongodb.com/docs/atlas/atlas-search/create-index/) by name.
   * This function only works when connected to MongoDB Atlas.
   */
  abstract dropSearchIndex(name: string): Promise<void>;

  /**
   * Event emitter that reports any errors that occurred. Useful for global error
   * handling.
   */
  events: NodeJS.EventEmitter;

  /**
   * Finds a single document by its _id field. `findById(id)` is almost*
   * equivalent to `findOne({ _id: id })`. If you want to query by a document's
   * `_id`, use `findById()` instead of `findOne()`.
   */
  abstract findById<ResultDoc = THydratedDocumentType>(
    id: any,
    projection: ProjectionType<TRawDocType> | null | undefined,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOne'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;
  abstract findById<ResultDoc = THydratedDocumentType>(
    id: any,
    projection?: ProjectionType<TRawDocType> | null,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;
  abstract findById<ResultDoc = THydratedDocumentType>(
    id: any,
    projection?: ProjectionType<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;

  /** Finds one document. */
  abstract findOne<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    projection: ProjectionType<TRawDocType> | null | undefined,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOne'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;
  abstract findOne<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;
  abstract findOne<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;
  abstract findOne<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;

  /**
   * Shortcut for creating a new Document from existing raw data, pre-saved in the DB.
   * The document returned has no paths marked as modified initially.
   */
  abstract hydrate(
    obj: any,
    projection?: AnyObject,
    options?: HydrateOptions,
  ): THydratedDocumentType;

  /**
   * This function is responsible for building [indexes](https://www.mongodb.com/docs/manual/indexes/),
   * unless [`autoIndex`](http://mongoosejs.com/docs/guide.html#autoIndex) is turned off.
   * Mongoose calls this function automatically when a model is created using
   * [`mongoose.model()`](/docs/api/mongoose.html#mongoose_Mongoose-model) or
   * [`connection.model()`](/docs/api/connection.html#connection_Connection-model), so you
   * don't need to call it.
   */
  abstract init(): Promise<THydratedDocumentType>;

  /** Inserts one or more new documents as a single `insertMany` call to the MongoDB server. */
  abstract insertMany(docs: Array<TRawDocType>): Promise<Array<THydratedDocumentType>>;
  abstract insertMany(
    docs: Array<TRawDocType>,
    options: InsertManyOptions & { lean: true },
  ): Promise<Array<Require_id<TRawDocType>>>;
  abstract insertMany(
    doc: Array<TRawDocType>,
    options: InsertManyOptions & { ordered: false; rawResult: true },
  ): Promise<
    mongodb.InsertManyResult<Require_id<TRawDocType>> & {
      mongoose: {
        validationErrors: (CastError | Error.ValidatorError)[];
        results: Array<Error | object | THydratedDocumentType>;
      };
    }
  >;
  abstract insertMany(
    docs: Array<TRawDocType>,
    options: InsertManyOptions & { lean: true; rawResult: true },
  ): Promise<mongodb.InsertManyResult<Require_id<TRawDocType>>>;
  abstract insertMany(
    docs: Array<TRawDocType>,
    options: InsertManyOptions & { rawResult: true },
  ): Promise<mongodb.InsertManyResult<Require_id<THydratedDocumentType>>>;
  abstract insertMany(
    doc: Array<TRawDocType>,
    options: InsertManyOptions,
  ): Promise<Array<THydratedDocumentType>>;
  abstract insertMany<DocContents = TRawDocType>(
    docs: Array<DocContents | TRawDocType>,
    options: InsertManyOptions & { lean: true },
  ): Promise<Array<Require_id<DocContents>>>;
  abstract insertMany<DocContents = TRawDocType>(
    docs: DocContents | TRawDocType,
    options: InsertManyOptions & { lean: true },
  ): Promise<Array<Require_id<DocContents>>>;
  abstract insertMany<DocContents = TRawDocType>(
    doc: DocContents | TRawDocType,
    options: InsertManyOptions & { ordered: false; rawResult: true },
  ): Promise<
    mongodb.InsertManyResult<Require_id<DocContents>> & {
      mongoose: {
        validationErrors: (CastError | Error.ValidatorError)[];
        results: Array<Error | object | MergeType<THydratedDocumentType, DocContents>>;
      };
    }
  >;
  abstract insertMany<DocContents = TRawDocType>(
    docs: Array<DocContents | TRawDocType>,
    options: InsertManyOptions & { rawResult: true },
  ): Promise<mongodb.InsertManyResult<Require_id<DocContents>>>;
  abstract insertMany<DocContents = TRawDocType>(
    docs: Array<DocContents | TRawDocType>,
  ): Promise<Array<MergeType<THydratedDocumentType, Omit<DocContents, '_id'>>>>;
  abstract insertMany<DocContents = TRawDocType>(
    doc: DocContents,
    options: InsertManyOptions & { lean: true },
  ): Promise<Array<Require_id<DocContents>>>;
  abstract insertMany<DocContents = TRawDocType>(
    doc: DocContents,
    options: InsertManyOptions & { rawResult: true },
  ): Promise<mongodb.InsertManyResult<Require_id<DocContents>>>;
  abstract insertMany<DocContents = TRawDocType>(
    doc: DocContents,
    options: InsertManyOptions,
  ): Promise<Array<MergeType<THydratedDocumentType, Omit<DocContents, '_id'>>>>;
  abstract insertMany<DocContents = TRawDocType>(
    docs: Array<DocContents | TRawDocType>,
    options: InsertManyOptions,
  ): Promise<Array<MergeType<THydratedDocumentType, Omit<DocContents, '_id'>>>>;
  abstract insertMany<DocContents = TRawDocType>(
    doc: DocContents,
  ): Promise<Array<MergeType<THydratedDocumentType, Omit<DocContents, '_id'>>>>;

  /**
   * Shortcut for saving one document to the database.
   * `MyModel.insertOne(obj, options)` is almost equivalent to `new MyModel(obj).save(options)`.
   * The difference is that `insertOne()` checks if `obj` is already a document, and checks for discriminators.
   */
  abstract insertOne<DocContents = AnyKeys<TRawDocType>>(
    doc: DocContents | TRawDocType,
    options?: SaveOptions,
  ): Promise<THydratedDocumentType>;

  /**
   * List all [Atlas search indexes](https://www.mongodb.com/docs/atlas/atlas-search/create-index/) on this model's collection.
   * This function only works when connected to MongoDB Atlas.
   */
  abstract listSearchIndexes(
    options?: mongodb.ListSearchIndexesOptions,
  ): Promise<Array<{ name: string }>>;

  /** The name of the model */
  modelName: string;

  /** Populates document references. */
  abstract populate(
    docs: Array<any>,
    options: PopulateOptions | Array<PopulateOptions> | string,
  ): Promise<Array<THydratedDocumentType>>;
  abstract populate(
    doc: any,
    options: PopulateOptions | Array<PopulateOptions> | string,
  ): Promise<THydratedDocumentType>;
  abstract populate<Paths>(
    docs: Array<any>,
    options: PopulateOptions | Array<PopulateOptions> | string,
  ): Promise<Array<MergeType<THydratedDocumentType, Paths>>>;
  abstract populate<Paths>(
    doc: any,
    options: PopulateOptions | Array<PopulateOptions> | string,
  ): Promise<MergeType<THydratedDocumentType, Paths>>;

  /**
   * Update an existing [Atlas search index](https://www.mongodb.com/docs/atlas/atlas-search/create-index/).
   * This function only works when connected to MongoDB Atlas.
   */
  abstract updateSearchIndex(name: string, definition: AnyObject): Promise<void>;

  /**
   * Changes the Connection instance this model uses to make requests to MongoDB.
   * This function is most useful for changing the Connection that a Model defined using `mongoose.model()` uses
   * after initialization.
   */
  abstract useConnection(connection: Connection): this;

  /** Casts and validates the given object against this model's schema, passing the given `context` to custom validators. */
  abstract validate(): Promise<void>;
  abstract validate(obj: any): Promise<void>;
  abstract validate(obj: any, pathsOrOptions: PathsToValidate): Promise<void>;
  abstract validate(obj: any, pathsOrOptions: { pathsToSkip?: pathsToSkip }): Promise<void>;

  /** Watches the underlying collection for changes using [MongoDB change streams](https://www.mongodb.com/docs/manual/changeStreams/). */
  abstract watch<
    ResultType extends mongodb.Document = any,
    ChangeType extends mongodb.ChangeStreamDocument = any,
  >(
    pipeline?: Array<Record<string, unknown>>,
    options?: mongodb.ChangeStreamOptions & { hydrate?: boolean },
  ): mongodb.ChangeStream<ResultType, ChangeType>;

  /** Registered discriminators for this model. */
  discriminators: { [name: string]: Model<any> } | undefined;

  /** Translate any aliases fields/conditions so the final query or document object is pure */
  abstract translateAliases(raw: any): any;

  /** Creates a `distinct` query: returns the distinct values of the given `field` that match `filter`. */
  abstract distinct<DocKey extends string, ResultType = unknown>(
    field: DocKey,
    filter?: QueryFilter<TRawDocType>,
    options?: QueryOptions<TRawDocType>,
  ): QueryWithHelpers<
    Array<
      DocKey extends keyof WithLevel1NestedPaths<TRawDocType>
        ? WithoutUndefined<Unpacked<WithLevel1NestedPaths<TRawDocType>[DocKey]>>
        : ResultType
    >,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'distinct',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `estimatedDocumentCount` query: counts the number of documents in the collection. */
  abstract estimatedDocumentCount(
    options?: QueryOptions<TRawDocType>,
  ): QueryWithHelpers<
    number,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'estimatedDocumentCount',
    TInstanceMethods & TVirtuals
  >;

  /**
   * Returns a document with its `_id` if at least one document exists in the database that matches
   * the given `filter`, and `null` otherwise.
   */
  abstract exists(
    filter: QueryFilter<TRawDocType>,
  ): QueryWithHelpers<
    { _id: InferId<TRawDocType> } | null,
    THydratedDocumentType,
    TQueryHelpers,
    TRawDocType,
    'findOne',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `find` query: gets a list of documents that match `filter`. */
  abstract find<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    projection: ProjectionType<TRawDocType> | null | undefined,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType[], 'find'>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
  abstract find<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null | undefined,
    options?: QueryOptions<TRawDocType> | null | undefined,
  ): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
  abstract find<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    projection?: ProjectionType<TRawDocType> | null | undefined,
  ): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
  abstract find<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
  ): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
  abstract find<ResultDoc = THydratedDocumentType>(): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `findByIdAndDelete` query, filtering by the given `_id`. */
  abstract findByIdAndDelete<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOneAndDelete'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndDelete<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true },
  ): QueryWithHelpers<
    ModifyResult<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndDelete<ResultDoc = THydratedDocumentType>(
    id?: mongodb.ObjectId | any,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `findOneAndUpdate` query, filtering by the given `_id`. */
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true; lean: true },
  ): QueryWithHelpers<
    ModifyResult<TRawDocType>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOneAndUpdate'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true },
  ): QueryWithHelpers<
    ModifyResult<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { upsert: true } & ReturnsNewDoc,
  ): QueryWithHelpers<
    ResultDoc,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    id?: mongodb.ObjectId | any,
    update?: UpdateQuery<TRawDocType>,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findByIdAndUpdate<ResultDoc = THydratedDocumentType>(
    id: mongodb.ObjectId | any,
    update: UpdateQuery<TRawDocType>,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `findOneAndDelete` query: atomically finds the given document, deletes it, and returns the document as it was before deletion. */
  abstract findOneAndDelete<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOneAndDelete'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndDelete<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true },
  ): QueryWithHelpers<
    ModifyResult<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndDelete<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType> | null,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndDelete',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `findOneAndReplace` query: atomically finds the given document and replaces it with `replacement`. */
  abstract findOneAndReplace<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    replacement: TRawDocType | AnyObject,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOneAndReplace'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndReplace',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndReplace<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    replacement: TRawDocType | AnyObject,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true },
  ): QueryWithHelpers<
    ModifyResult<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndReplace',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndReplace<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    replacement: TRawDocType | AnyObject,
    options: QueryOptions<TRawDocType> & { upsert: true } & ReturnsNewDoc,
  ): QueryWithHelpers<
    ResultDoc,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndReplace',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndReplace<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
    replacement?: TRawDocType | AnyObject,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndReplace',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `findOneAndUpdate` query: atomically find the first document that matches `filter` and apply `update`. */
  abstract findOneAndUpdate<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true; lean: true },
  ): QueryWithHelpers<
    ModifyResult<TRawDocType>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndUpdate<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { lean: true },
  ): QueryWithHelpers<
    GetLeanResultType<TRawDocType, TRawDocType, 'findOneAndUpdate'> | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndUpdate<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { includeResultMetadata: true },
  ): QueryWithHelpers<
    ModifyResult<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndUpdate<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType>,
    options: QueryOptions<TRawDocType> & { upsert: true } & ReturnsNewDoc,
  ): QueryWithHelpers<
    ResultDoc,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;
  abstract findOneAndUpdate<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
    update?: UpdateQuery<TRawDocType>,
    options?: QueryOptions<TRawDocType> | null,
  ): QueryWithHelpers<
    ResultDoc | null,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'findOneAndUpdate',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `replaceOne` query: finds the first document that matches `filter` and replaces it with `replacement`. */
  abstract replaceOne<ResultDoc = THydratedDocumentType>(
    filter?: QueryFilter<TRawDocType>,
    replacement?: TRawDocType | AnyObject,
    options?: (mongodb.ReplaceOptions & QueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    UpdateWriteOpResult,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'replaceOne',
    TInstanceMethods & TVirtuals
  >;

  /** Apply changes made to this model's schema after this model was compiled. */
  abstract recompileSchema(): void;

  /** Schema the model uses. */
  schema: Schema<TRawDocType>;

  /** Creates a `updateMany` query: updates all documents that match `filter` with `update`. */
  abstract updateMany<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline,
    options?: (mongodb.UpdateOptions & MongooseUpdateQueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    UpdateWriteOpResult,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'updateMany',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a `updateOne` query: updates the first document that matches `filter` with `update`. */
  abstract updateOne<ResultDoc = THydratedDocumentType>(
    filter: QueryFilter<TRawDocType>,
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline,
    options?: (mongodb.UpdateOptions & MongooseUpdateQueryOptions<TRawDocType>) | null,
  ): QueryWithHelpers<
    UpdateWriteOpResult,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'updateOne',
    TInstanceMethods & TVirtuals
  >;
  abstract updateOne<ResultDoc = THydratedDocumentType>(
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline,
  ): QueryWithHelpers<
    UpdateWriteOpResult,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'updateOne',
    TInstanceMethods & TVirtuals
  >;

  /** Creates a Query, applies the passed conditions, and returns the Query. */
  abstract where<ResultDoc = THydratedDocumentType>(
    path: string,
    val?: any,
  ): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods
  >;
  abstract where<ResultDoc = THydratedDocumentType>(
    obj: object,
  ): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
  abstract where<ResultDoc = THydratedDocumentType>(): QueryWithHelpers<
    Array<ResultDoc>,
    ResultDoc,
    TQueryHelpers,
    TRawDocType,
    'find',
    TInstanceMethods & TVirtuals
  >;
}
