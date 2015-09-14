/*
  Provides Model.StoreOne, a variant of Model.Store that stores a single
  key
*/

/// <reference path="./Model.ts" />

module Esper.Model {

  // Base class for Model Stores
  export class StoreOne<TData> extends StoreBase<TData> {

    // Actual data object
    protected data: [TData, StoreMetadata];

    constructor() {
      super();
      this.reset();
    }

    // Clears all data in store
    reset(): void {
      delete this.data;
    }

    // Returns an instance stored with a particular _id
    get(): [TData, StoreMetadata] {
      if (this.isSet()) {
        return this.data;
      }
    }

    val(): TData {
      return this.get()[0];
    }

    metadata(): StoreMetadata {
      return this.get()[1];
    }

    // Returns true if an item exists
    isSet(): boolean {
      return this.hasOwnProperty("data");
    }

    // Set a given _id to object
    // TODO: Refactor against Model.ts code a bit more
    set(tuple: [TData, StoreMetadata]): void;
    set(updateFn: UpdateFn<TData>): void;
    set(data: TData, metadata?: StoreMetadata): void;
    set(firstArg: any, secondArg?: any): void {
      var data: TData;
      var metadata: StoreMetadata;
      if (secondArg) {
        data = (<TData> firstArg);
        metadata = (<StoreMetadata> secondArg);
      }
      else if (firstArg instanceof Array) {
        data = (<TData> firstArg[0]);
        metadata = (<StoreMetadata> firstArg[1]);
      }
      else if (_.isFunction(firstArg)) {
        let current: [TData, StoreMetadata] = this.get();
        let result = current ? firstArg.apply(null, current) : firstArg();
        if (_.isArray(result)) {
          data = result[0];
          metadata = result[1];
        } else {
          data = result;
        }
      }
      else {
        data = (<TData> firstArg);
      }
      metadata = this.cleanMetadata(data, metadata);

      // Store data in immutable fashion
      this.data = Util.deepFreeze<[TData,StoreMetadata]>([data, metadata]);
      this.emitChange();
    }

    // Hook to preset metadata before it's set
    protected cleanMetadata(data: TData, metadata?: StoreMetadata)
      : StoreMetadata
    {
      // Use pre-existing metadata if none exists
      if (! metadata) {
        if (this.isSet()) {
          metadata = _.cloneDeep(this.get()[1]);
        }
        else {
          metadata = {};
        }
      }

      // Some defaults and overrides
      metadata.dataStatus = metadata.dataStatus || DataStatus.READY;
      metadata.lastUpdate = new Date();
      return metadata;
    }

    unset() {
      if (this.isSet()) {
        delete this.data;
        this.emitChange();
      }
    }
  }
}
