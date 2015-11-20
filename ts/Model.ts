/*
  Helpers and base classes for a datastore with event listeners. Useful as
  part of the store in the Flux pattern (see
  https://facebook.github.io/flux/docs/overview.html for more details).

  Model.Store is a base class for a basic key-value store. It stores 2-tuples
  of a particular data type and metadata. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Emit.ts" />

module Esper.Model {


  ////////////////

  export enum DataStatus {
    READY = 1,  // Local state accurately reflects server (as far as we know)
    UNSAVED,    // Local state has changes not yet pushed to server
    INFLIGHT,   // Push to server in progress
    FETCHING,   // Pull from server in progress
    PUSH_ERROR, // Error while saving (treat as unsaved)
    FETCH_ERROR // Error while fetching
  };

  // Metadata that lives alongside the actual object data -- need at least
  // an identifier
  export interface StoreMetadata {
    _id?: string;
    dataStatus?: DataStatus;
    lastUpdate?: Date;
    aliases?: string[];
    lastError?: Error;
  }

  // Typeguard functions for metadata
  export function isMetadata(arg: any): arg is StoreMetadata {
    return !!(typeof arg === "object" && _.difference(
      _.keys(arg),
      ["_id", "dataStatus", "lastUpdate", "aliases", "lastError"]
    ).length === 0);
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
  export class StoreBase<TData> extends Emit.EmitBase {
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

    isTuple(arg: TData|[TData, StoreMetadata]): arg is [TData, StoreMetadata]
    {
      return (arg instanceof Array &&
        arg.length === 2 &&
        isMetadata(arg[1]));
    }
  }

  // Base class for Model Stores
  export class Store<TData> extends StoreBase<TData> {

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
      register(this, _id); // Tracker registration
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
      } else if (this.isTuple(firstArg)) {
        data = firstArg[0];
        metadata = firstArg[1];
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
      // Make sure _id matches. Extend old values.
      metadata = _.extend(
        _.cloneDeep(this.metadata(_id) || {}),
        metadata,
        {_id: _id});

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

    /* Updates a key's data and/or metadata */
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

      if (this.isTuple(update)) {
        data = update[0];
        metadata = update[1];
      } else {
        data = update;
      }

      this.set(_id, data, metadata);
    }

    /*
      Variant of upsert that only updates if metadata is not UNSAVED or
      INFLIGHT (avoids clobbering user data)
    */
    upsertSafe(_id: string, upsertFn: UpdateFn<TData>): void;
    upsertSafe(_id: string, tuple: [TData, StoreMetadata]): void;
    upsertSafe(_id: string, data: TData, metadata?: StoreMetadata): void;
    upsertSafe(_id: string, update: any, metadata?: StoreMetadata): void {
      var currentMeta = this.metadata(_id);
      var dataStatus = currentMeta && currentMeta.dataStatus;
      if (dataStatus !== Model.DataStatus.UNSAVED &&
          dataStatus !== Model.DataStatus.INFLIGHT) {
        return this.upsert(_id, update, metadata);
      }
    }

    /*
      Helper to fetch data via a promise and store it at a particular key when
      the promise resolves. Updates dataStatus metadata accordingly.
    */
    fetch(_id: string, promise: JQueryPromise<TData>) {
      // Set to FETCHING (but don't override UNSAVED or INFLIGHT to preserve
      // any user-set data we may have cached)
      this.upsertSafe(_id, function(data, metadata) {
        return [data, {
          dataStatus: Model.DataStatus.FETCHING
        }];
      });

      promise.done((newData: TData) => {
        // On success, update store
        this.upsertSafe(_id, newData, {
          dataStatus: Model.DataStatus.READY
        });
      }).fail((err) => {
        // On failure, update store to note failure (again, don't override
        // user data)
        this.upsertSafe(_id, function(data, metadata) {
          return [data, {
            dataStatus: Model.DataStatus.FETCH_ERROR,
            lastError: err
          }];
        });
        return err;
      });
    }

    /*
      Helper to save data via a promise and update dataStatus metadata based
      on promise resolution. Optionally takes new data to populate store.
    */
    push(_id: string, promise: JQueryPromise<any>, newData?: TData) {
      promise = promise.then(() => {
        return this.val(_id);
      });
      this.pushFetch(_id, promise, newData);
    }

    /*
      Helper to save data via a promise and update data based on what the
      promise returns. Updates dataStatus accordingly. Can also set initial
      data in store pending promise resolution.
    */
    pushFetch(_id: string, promise: JQueryPromise<TData>, initData?: TData) {
      // Set to INFLIGHT and populate with initData (if any)
      this.upsert(_id, function(data, metadata) {
        return [
          initData === undefined ? data : initData,
          { dataStatus: Model.DataStatus.INFLIGHT }
        ];
      });

      /*
        canSave for push / pushFetch works differently from fetch -- we don't
        want to clobber UNSAVED data only (i.e. data that was changed in
        between us initiating a push to server and us receiving a response)
      */
      function canSave(metadata: StoreMetadata) {
        var dataStatus = metadata && metadata.dataStatus;
        return dataStatus !== Model.DataStatus.UNSAVED;
      }

      promise.done((newData: TData) => {
        // On success, update store
        this.upsert(_id, function(data, metadata) {
          if (canSave(metadata)) {
            return [newData, {
              dataStatus: Model.DataStatus.READY
            }];
          }
        });
      }).fail((err) => {
        // On failure, update store to note failure (again, don't override
        // user data)
        this.upsert(_id, function(data, metadata) {
          if (canSave(metadata)) {
            return [data, {
              dataStatus: Model.DataStatus.PUSH_ERROR,
              lastError: err
            }];
          }
        });
        return err;
      });
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


  ////////////

  export interface TrackingKey {
    store: StoreBase<any>;
    key?: string;
  }

  /*
    Tracking code is loosely inspired by Meteor's tracker
    (https://www.meteor.com/tracker).

    It is intended for use with our React classes. Basic idea is to track
    calls to our stores to make it easy to set up auto-updating React
    components.

    Track takes two functions. It calls the first function and returns its
    return value. It also calls the post function with a list of variables
    that have been tracked.
  */
  export function track<T>(main: () => T,
    post: (args: TrackingKey[]) => void): T
  {
    trackingKeys = [];
    isTrackingActive = true;
    var ret = main();
    post(trackingKeys);
    isTrackingActive = false;
    return ret;
  }

  export function register<T>(store: StoreBase<T>, key?: string) {
    // Avoid duplicate registries
    if (isTrackingActive &&
        !_.find(trackingKeys, (k) => k.store === store && k.key === key))
    {
      if (key) {
        trackingKeys.push({
          store: store,
          key: key
        });
      } else {
        trackingKeys.push({
          store: store,
        });
      }
    }
  }

  // Boolean to test if tracking is active
  var isTrackingActive = false;

  // A list of registered trackingKeys we're tracking
  var trackingKeys: TrackingKey[];
}

