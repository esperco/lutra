/*
  Helpers and base classes for a datastore with event listeners. Useful as
  part of the store in the Flux pattern (see
  https://facebook.github.io/flux/docs/overview.html for more details).

  Model2.Store is a base class for a basic key-value store. It stores 2-tuples
  of a particular data type and metadata. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.

  Rewrite of original Model.Store class
*/

/// <reference path="./Emit.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./Tracker.ts" />
/// <reference path="./Util.ts" />

module Esper.Model2 {

  export enum DataStatus {
    READY = 1,  // Local state accurately reflects server (as far as we know)
    UNSAVED,    // Local state has changes not yet pushed to server
    INFLIGHT,   // Push to server in progress
    FETCHING,   // Pull from server in progress
    PUSH_ERROR, // Error while saving (treat as unsaved)
    FETCH_ERROR // Error while fetching
  };

  // Wrapper around stored data
  export interface StoreData<K, D> {
    dataStatus: DataStatus;
    lastUpdate: Date;
    data: Option.T<D>;
    aliases: K[];
    lastError?: Error;
  }

  // Interface for the mutable parts of store metadata
  export interface StoreOpts<K> {
    dataStatus?: Model2.DataStatus,
    aliases?: K[];
    lastError?: Error;
  }

  // Push callback gets called whenever a push to a store happens
  // Used by Save.ts
  interface PushCallback<K> {
    (s: Store<K, any>, k: K, p: JQueryPromise<any>): void;
  }

  var pushCallbacks: PushCallback<any>[] = [];

  export function registerPushCallback<K>(fn: PushCallback<K>) {
    pushCallbacks.push(fn);
  }


  ////////////

  // Base class for Store-like classes with EventEmitters
  export class Store<TKey, TData> extends Emit.EmitBase {

    // Actual container for data
    protected data: {
      [index: string]: StoreData<TKey, TData>;
    };

    // Vars set by constructor
    idForData: (data: TData) => TKey
    validate: (data: TData) => boolean;
    cap: number;
    size: number;

    //////

    constructor(opts?: {
      // Max number of keys to store
      cap?: number,

      // Function to extract a key from data object -- will add to a data
      // object's aliases if not already included
      idForData?: (data: TData) => TKey,

      // Validate data stored, normalize to Option.None if invalid
      validate?: (data: TData) => boolean
    }) {
      super();
      this.reset();

      opts = opts || {};
      this.cap = opts.cap;
      this.idForData = opts.idForData;
      this.validate = opts.validate;
    }

    // Clears all data in store
    reset(): void {
      this.data = {};
      this.size = 0;
    }


    //////

     // More explicit typing on listeners
    addChangeListener(callback: (_ids: TKey[]) => void): void {
      super.addChangeListener(callback);
    }

    removeChangeListener(callback: (_ids: TKey[]) => void): void {
      super.removeChangeListener(callback);
    }

    private emittedIds: TKey[];
    private inTransaction: boolean;

    // Update emitChange to handle aliases
    emitChange(_ids?: TKey[]): void {
      if (this.inTransaction) {
        if (_ids) {
          this.emittedIds = (this.emittedIds || []).concat(_ids);
        }
      } else {
        super.emitChange(_ids);
      }
    }

    /*
      Calls function within a "transaction" inspired by database transactions.

      When using transact, Store waits until the passed function completes
      until calling change listeners and only calls those listeners once
      per transaction.

      Nested transactions are subsumed into parent transactions -- i.e. calling
      a transaction within a transaction is equivalent to calling the single
      parent transaction by itself.
    */
    transact(fn: () => void) {
      var topLevel = !this.inTransaction;
      this.inTransaction = true;
      fn();
      if (topLevel) {
        this.inTransaction = false;
        this.emitChange(this.emittedIds);
        this.emittedIds = [];
      }
    }

    /*
      Takes a promise and calls a function with a wrapped copy of that promise
      which runs the promise's callback functions within a transaction
    */
    transactP<T>(p: JQueryPromise<T>, fn: (p: JQueryPromise<T>) => void) {
      var topLevel: boolean;
      p.always(() => {
        topLevel = !this.inTransaction;
        this.inTransaction = true;
      });

      fn(p);

      p.always(() => {
        if (topLevel) {
          this.inTransaction = false;
          this.emitChange(this.emittedIds);
          this.emittedIds = [];
        }
      });
    }


    //////

    get(_id: TKey): Option.T<StoreData<TKey, TData>> {
      var key = Util.cmpStringify(_id);
      var ret = Option.wrap(this.data[key]);
      ret.match({
        none: () => Tracker.register(this, _id),
        some: (d) => { _.each(d.aliases,
          (a) => Tracker.register(this, a)
        )}
      });
      return ret;
    }

    /*
      Get data option only -- should not be used outside of model because
      we want reliant code to explicitly differentiate between data not
      being set in store yet vs. data not existing
    */
    protected getData(_id: TKey): Option.T<TData> {
      return this.get(_id).flatMap((d) => d.data)
    }

    // Clones frozen data, so it can be edited
    cloneData(_id: TKey): Option.T<TData> {
      return this.getData(_id).flatMap((d) => Option.wrap(_.cloneDeep(d)));
    }

    // Shorcut to determine if data at key has an error status
    hasError(_id: TKey): boolean {
      return this.get(_id).mapOr(
        false,
        (d) => (d.dataStatus === DataStatus.FETCH_ERROR ||
                d.dataStatus === DataStatus.PUSH_ERROR)
      );
    }

    // Shorcut to determine if data at key is busy (fetching, saving, etc.)
    isBusy(_id: TKey) {
      return this.get(_id).mapOr(
        false,
        (d) => (d.dataStatus === DataStatus.INFLIGHT ||
                d.dataStatus === DataStatus.FETCHING)
      );
    }

    all(): StoreData<TKey, TData>[] {
      Tracker.register(this);
      return _.uniq(_.values<StoreData<TKey, TData>>(this.data));
    }


    //////////

    // Set data + optionally metadata
    set(_id: TKey, data: Option.T<TData>, opts?: StoreOpts<TKey>): void {
      opts = opts || {};

      Log.assert(!_.isUndefined(data) && data !== null,
        "Do not store null data inside store -- use Option.none");

      // Validate data before setting
      if (this.validate) {
        data = data.flatMap((x) => this.validate(x) ?
          Option.some(x) : Option.none<TData>());
      }

      // See if an instance of data under this key or any alias already exists
      var aliases = Util.some(opts.aliases, [])
        .concat([_id])
        .concat((this.idForData && data.isSome()) ?
                [this.idForData(data.unwrap())] : []);
      var allExisting = _(aliases)
        .map((a) => Util.cmpStringify(a))
        .filter((s) => this.data.hasOwnProperty(s))
        .map((s) => this.data[s])
        .uniq()
        .value();

      // Sanity check
      Log.assert(allExisting.length <= 1,
        "Aliased _ids " + _.map(aliases, Util.cmpStringify).join(", ") +
        " reference different objects"
      );

      // Increment count if new
      if (allExisting.length === 0) {
        this.size += 1;
      }

      // Compute final list of aliases based on existing data
      var existing = Option.wrap(allExisting[0]);
      aliases = aliases.concat(existing.mapOr([], (d) => d.aliases));
      aliases = _.uniqBy(aliases, Util.cmpStringify);

      // Create and freeze wrapper around data
      var storeData: StoreData<TKey, TData> = {
        dataStatus: Util.some(opts.dataStatus, existing.mapOr(
          DataStatus.READY, (d) => d.dataStatus)),
        lastUpdate: new Date(),
        data: data,
        aliases: aliases,
        lastError: opts.lastError
      };
      storeData = Util.deepFreeze(storeData);

      // Store under each alias, and emit a change for each alias
      _.each(aliases, (a) => {
        this.data[Util.cmpStringify(a)] = storeData;
      });

      // Remove excess items if capped
      if (this.size > this.cap) {

        // Pick out oldest (last updated) item
        var sortedItems = _.sortBy(this.all(), (d) => d.lastUpdate.getTime());

        /*
          Don't call this.remove because we don't necessarily want to emit
          a change event if the element is already rendered in the DOM. Just
          remove from internal data reference.
        */
        _.each(sortedItems[0].aliases, (a) => {
          delete this.data[Util.cmpStringify(a)];
        });

        // Implicit assumption we're never more than one over cap
        this.size = this.cap;
      }

      this.emitChange(aliases);
    }

    // Set metadata only
    setOpt(_id: TKey, opts: StoreOpts<TKey>): void {
      return this.set(_id, this.getData(_id), opts);
    }


    ////////////

    /*
      Variant of set that only updates if metadata is not UNSAVED or
      INFLIGHT (avoids clobbering user data). Returns true if successful
    */
    setSafe(_id: TKey, data: Option.T<TData>, opts?: StoreOpts<TKey>)
      : boolean
    {
      return this.get(_id).match({
        none: () => {
          this.set(_id, data, opts);
          return true;
        },
        some: (d) => {
          if (d.dataStatus !== Model2.DataStatus.UNSAVED &&
              d.dataStatus !== Model2.DataStatus.INFLIGHT) {
            this.set(_id, data, opts);
            return true;
          }
          return false;
        }
      });
    }

    // Like setSafe, but sans data
    setSafeOpt(_id: TKey, opts: StoreOpts<TKey>): boolean {
      return this.setSafe(_id, this.getData(_id), opts);
    }

    /*
      Helper to fetch data via a promise and store it at a particular key when
      the promise resolves. Updates dataStatus metadata accordingly.
    */
    fetch(_id: TKey, promise: JQueryPromise<Option.T<TData>>) {
      this.setSafeOpt(_id, {
        dataStatus: Model2.DataStatus.FETCHING
      });

      return promise.then((optData: Option.T<TData>) => {
        // On success, update store
        this.setSafe(_id, optData, {
          dataStatus: Model2.DataStatus.READY
        });
        return optData;

      }).fail((err) => {
        // On failure, update store to note failure (again, don't override
        // user data)
        this.setSafe(_id, Option.none<TData>(), {
          dataStatus: Model2.DataStatus.FETCH_ERROR,
          lastError: err
        });
        return err;
      });
    }

    /*
      Helper to save data via a promise and update dataStatus metadata based
      on promise resolution. Optionally takes new data to populate store.
    */
    push(_id: TKey, promise: JQueryPromise<any>, newData: Option.T<TData>) {
      this.pushFetch(_id, promise.then(() => this.getData(_id)), newData);
    }

    /*
      Helper to save data via a promise and update data based on what the
      promise returns. Updates dataStatus accordingly. Can also set initial
      data in store pending promise resolution.
    */
    pushFetch(_id: TKey, promise: JQueryPromise<Option.T<TData>>,
              initData?: Option.T<TData>)
    {
      // Call push callbacks if applicable
      _.each(pushCallbacks,
        (cb: PushCallback<TKey>) => cb(this, _id, promise)
      );

      // Set to INFLIGHT and populate with initData (if any)
      this.set(_id, Util.some(initData, this.getData(_id)), {
        dataStatus: Model2.DataStatus.INFLIGHT
      });

      /*
        canSave for push / pushFetch works differently from fetch -- we don't
        want to clobber UNSAVED data only (i.e. data that was changed in
        between us initiating a push to server and us receiving a response)
      */
      var canSave = () => this.get(_id).mapOr(
        true, (d) => d.dataStatus !== Model2.DataStatus.UNSAVED);

      promise.then((optData: Option.T<TData>) => {
        // On success, update store
        canSave() && this.set(_id, optData, {
          dataStatus: Model2.DataStatus.READY
        });
        return optData;

      }).fail((err) => {
        // On failure, update store to note failure (again, don't override
        // user data)
        canSave() && this.setOpt(_id, {
          dataStatus: Model2.DataStatus.PUSH_ERROR,
          lastError: err
        });
        return err;
      });
    }

    // Remove a key from store, returns true if something was deleted
    remove(_id: TKey): boolean {
      return this.get(_id).match({
        none: () => false,
        some: (d) => {
          _.each(d.aliases, (a) => {
            delete this.data[Util.cmpStringify(a)]
          });
          this.size -= 1;
          this.emitChange(d.aliases);
          return true;
        }
      });
    }

    // Alias for remove
    unset(_id: TKey): void {
      this.remove(_id);
    }
  }
}

