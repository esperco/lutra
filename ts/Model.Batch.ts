/*
  Module for helping with batch models that store references to individual
  items (indexed via keys in a separate store)
*/

/// <reference path="./Model.Capped.ts" />
module Esper.Model {
  export class BatchStore<TData> extends CappedStore<string[]> {
    itemStore: Model.Store<TData>;

    constructor(itemStore: Model.Store<TData>, cap=DEFAULT_CAP) {
      super(cap);
      this.itemStore = itemStore;
    }

    batchUpsert(_id: string, values: [string, TData][],
      metadata?: StoreMetadata): void
    {
      var keys: string[] = [];

      _.each(values, (tuple) => {
        var _id = tuple[0];
        var data = tuple[1];
        this.itemStore.upsert(_id, data);
        keys.push(_id);
      });

      if (metadata) {
        this.upsert(_id, keys, metadata);
      } else {
        this.upsert(_id, keys);
      }
    }

    batchVal(_id: string): TData[] {
      var idList = this.val(_id);
      return _.map(idList, (_id) => this.itemStore.val(_id));
    }
  }
}