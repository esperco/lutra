/*
  Helpers and base classes for a datastore with event listeners. Useful as
  part of the store in the Flux pattern (see
  https://facebook.github.io/flux/docs/overview.html for more details).

  Model.Store is a base class for a basic key-value store. It stores 2-tuples
  of a particular data type and metadata. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.
*/

/// <reference path="./Util.ts" />
/// <reference path="./Emit.ts" />

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
    aliases?: string[];
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
  export class StoreBase extends Emit.EmitBase {
    // More explicit typing on listeners
    addChangeListener(callback: (_ids: string[]) => void): void {
      super.addChangeListener(callback);
    }

    removeChangeListener(callback: (_ids: string[]) => void): void {
      super.removeChangeListener(callback);
    }

    protected emitChange(_ids?: string[]): void {
      super.emitChange(_ids);
    }
  }

  // Base class for Model Stores
  export class Store<TData> extends StoreBase {

    // Actual container for data
    protected data: {
      [index: string]: [TData, StoreMetadata];
    };

    // Alias map
    protected aliases: {
      [index: string]: string;
    };


    ///////////

    constructor() {
      super();
      this.reset();
    }

    // Clears all data in store
    reset(): void {
      this.data = {};
      this.aliases = {};
    }

    // Returns an instance stored with a particular _id
    get(_id: string): [TData, StoreMetadata] {
      _id = this.aliasOrId(_id);
      if (this.has(_id)) {
        return this.data[_id];
      }
    }

    // Returns just the value and not the metadata
    val(_id: string): TData {
      _id = this.aliasOrId(_id);
      if (this.has(_id)) {
        return this.data[_id][0];
      }
    }

    metadata(_id: string): StoreMetadata {
      _id = this.aliasOrId(_id);
      if (this.has(_id)) {
        return this.data[_id][1];
      }
    }

    protected aliasOrId(_id: string): string {
      return this.aliases[_id] || _id;
    }

    // Return all store objects
    getAll(): [TData, StoreMetadata][] {
      return _.values<[TData, StoreMetadata]>(this.data);
    }

    valAll(): TData[] {
      return _.map(this.getAll(), function(tuple) { return tuple[0]; });
    }

    // Alias two _ids -- e.g. for when we assign a random _id to a model
    // for temp display and then need to associate the same model with the
    // new (real) _id
    alias(currentId: string, newId: string): void {
      if (this.has(currentId)) {
        this.aliases[newId] = currentId;
        this.updateMetadata(currentId, {}, true);
      }
    }


    ////////////

    // CRUD-related helper functions

    // Returns true if an item exists
    has(_id: string): boolean {
      _id = this.aliasOrId(_id);
      return this.data.hasOwnProperty(_id);
    }

    // Set a given _id to object
    set(_id: string, tuple: [TData, StoreMetadata]): void;
    set(_id: string, data: TData, metadata?: StoreMetadata): void;
    set(_id: string, firstArg: any, secondArg?: any): void {
      var origId = _id;
      _id = this.aliasOrId(_id);

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
      metadata = this.cleanMetadata(_id, metadata);
      // Store data in immutable fashion
      this.data[_id] = [
        Util.deepFreeze<TData>(data),
        Util.deepFreeze<StoreMetadata>(metadata)
      ];
      this.emitChange([origId]);
    }

    // Hook to preset metadata before it's set
    protected cleanMetadata(_id: string, metadata?: StoreMetadata)
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
      metadata.aliases = [];
      _.each(this.aliases, function(val, key) {
        if (val === _id) {
          metadata.aliases.push(key);
        }
      });
      return metadata;
    };

    // Update metadata for a given _id -- can do so without emiting
    protected updateMetadata(_id: string, metadata?: StoreMetadata,
                             silent=false) {
      if (this.has(_id)) {
        metadata = this.cleanMetadata(_id, metadata);
        this.data[_id][1] = metadata;
        if (! silent) {
          this.emitChange([_id]);
        }
      }
    }

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
        _id = this.aliasOrId(_id);
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
        var origId = _id;
        var aliases = this.aliases;
        if (aliases[_id]) {
          _id = aliases[_id];
          delete aliases[_id];
        }

        // This is clunky, but if we aren't storing a lot of data, iteration
        // is fine.
        _.each(aliases, function(val, key) {
          if (val === _id) {
            delete aliases[key];
          }
        });

        delete this.data[_id];
        this.emitChange([origId]);
      }
    }

    // Alias for remove
    unset(_id: string): void {
      this.remove(_id);
    }
  }
}

