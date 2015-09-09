/*
  Helpers and base classes for a datastore with event listeners. Useful as
  part of the store in the Flux pattern (see
  https://facebook.github.io/flux/docs/overview.html for more details).

  Model.Store is a base class for a basic key-value store. It stores 2-tuples
  of a particular data type and metadata. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.
*/
module Esper.Model {


  ////////////////

  // Ready => Local state accurately reflects server (as far as we know)
  // InFlight => Local changes en route to server
  export enum DataStatus { READY, INFLIGHT };

  // Metadata that lives alongside the actual object data -- need at least
  // an identifier
  export interface StoreMetadata {
    _id?: string;
    dataStatus?: DataStatus;
    lastUpdate?: Date;
  }

  // Variant on StoreMetadata for new objects (_id is required)
  export interface StoreMetadataForInsert extends StoreMetadata {
    _id: string;
  }


  ////////////

  // An update function is a function that receives data and metadata and
  // returns either the updated object or an updated object/metadata pairing.
  // Used in update function below
  export interface UpdateFn<TData> {
    (oldData: TData, oldMetadata: StoreMetadata): TData|[TData, StoreMetadata];
  }

  // Base class for Store-like classes with EventEmitters
  export class StoreBase<TData> extends EventEmitter {
    /*
      For simplicity we just emit a single change variable whenever any
      modification happens to a store. We can pass along a list of _id changes
      but otherwise we let the handler re-query as appropriate to figure out
      what's different. This may be a little inefficient, but it's
      insignificant relative to round-trip time to a server or updating the
      actual DOM, and it makes reasoning about our code a lot easier.
    */
    protected CHANGE_EVENT: string = "CHANGE";

    // Register a callback to handle store changes
    addChangeListener(callback: (_ids: string[]) => void): void {
      this.on(this.CHANGE_EVENT, callback);
    }

    // De-register a callback to handle store changes
    removeChangeListener(callback: (_ids: string[]) => void): void {
      this.removeListener(this.CHANGE_EVENT, callback);
    }

    // Remove all listeners
    removeAllChangeListeners(): void {
      this.removeAllListeners(this.CHANGE_EVENT);
    }

    // Call this whenever the store is changed. This class is protected so
    // that we can modify or override in derived classes
    protected emitChange(_ids?: string[]): void {
      if (_ids) {
        this.emit(this.CHANGE_EVENT, _ids);
      } else {
        this.emit(this.CHANGE_EVENT);
      }
    }
  }

  // Base class for Model Stores
  export class Store<TData> extends StoreBase<TData> {

    // Actual container for data
    protected data: {
      [index: string]: [TData, StoreMetadata];
    };


    ///////////

    constructor() {
      super();
      this.reset();
    }

    // Clears all data in store
    reset(): void {
      this.data = {};
    }

    // Returns an instance stored with a particular _id
    get(_id: string): [TData, StoreMetadata] {
      if (this.has(_id)) {
        return this.data[_id];
      }
    }

    // Return all store objects
    getAll(): [TData, StoreMetadata][] {
      return _.values<[TData, StoreMetadata]>(this.data);
    }


    ////////////

    // CRUD-related helper functions

    // Returns true if an item exists
    has(_id: string): boolean {
      return this.data.hasOwnProperty(_id);
    }

    // Set a given _id to object
    set(_id: string, tuple: [TData, StoreMetadata]): void;
    set(_id: string, data: TData, metadata?: StoreMetadata): void;
    set(_id: string, firstArg: any, secondArg?: any): void {
      var data: TData;
      var metadata: StoreMetadata;
      if (secondArg) {
        data = (<TData> firstArg);
        metadata = (<StoreMetadata> secondArg);
      } else if (firstArg instanceof Array) {
        data = (<TData> firstArg[0]);
        metadata = (<StoreMetadata> firstArg[1]);
      } else {
        data = (<TData> firstArg);
      }
      metadata = this.cleanMetadata(_id, data, metadata);
      // Store data in immutable fashion
      this.data[_id] = Util.deepFreeze<[TData,StoreMetadata]>([data, metadata]);
      this.emitChange([_id]);
    }

    // Hook to preset metadata before it's set
    protected cleanMetadata(_id: string, data: TData, metadata?: StoreMetadata)
      : StoreMetadata
    {
      // Make sure _id matches
      if (metadata) {
        metadata._id = _id;
      }
      else if (this.has(_id)) {
        metadata = _.cloneDeep(this.get(_id)[1]);
      }
      else {
        metadata = { _id: _id };
      }

      // Some defaults and overrides
      metadata.dataStatus = metadata.dataStatus || DataStatus.READY;
      metadata.lastUpdate = new Date();
      return metadata;
    };

    /* Inserts a new object at key, fails if key already exists */
    insert(_id: string, data: TData): void;
    insert(data: TData, metadata: StoreMetadataForInsert): void;
    insert(firstArg: any, secondArg: any): void {
      let data: TData;
      let metadata: StoreMetadata;

      if (_.isString(firstArg)) {
        metadata = { _id: (<string> firstArg) };
        data = (<TData> secondArg);
      }
      else {
        metadata = (<StoreMetadata> secondArg);
        data = (<TData> firstArg);
      }

      let _id: string = metadata._id;
      if (this.has(_id)) {
        throw new Error("Property already exists for store key: " + _id);
      }

      this.set(_id, [data, metadata]);
    }

    /* Updates a key's data and/or metadata -- fun */
    update(_id: string, updateFn: UpdateFn<TData>): void;
    update(_id: string, tuple: [TData, StoreMetadata]): void;
    update(_id: string, data: TData, metadata?: StoreMetadata): void;
    update(_id: string, update: any, metadata?: StoreMetadata): void {
      if (this.has(_id)) {
        this.upsert(_id, update, metadata);
      }
      else {
        throw new Error("Store key does not exist: " + _id);
      }
    }

    /* Upsert is like update, but allows inserting a key if it doesn't exist */
    upsert(_id: string, upsertFn: UpdateFn<TData>): void;
    upsert(_id: string, tuple: [TData, StoreMetadata]): void;
    upsert(_id: string, data: TData, metadata?: StoreMetadata): void;
    upsert(_id: string, update: any, metadata?: StoreMetadata): void {
      let data: TData;

      // Handle different function variants
      if (_.isFunction(update)) {
        let current: [TData, StoreMetadata] = this.get(_id);
        update = current ? update.apply(null, current) : update();
      }

      if (_.isArray(update)) {
        data = update[0];
        metadata = update[1];
      } else {
        data = update;
      }

      this.set(_id, data, metadata);
    }

    // Remove a key from store
    remove(_id: string): void {
      if (this.has(_id)) {
        delete this.data[_id];
        this.emitChange([_id]);
      }
    }

    // Alias for remove
    unset(_id: string): void {
      this.remove(_id);
    }
  }
}

