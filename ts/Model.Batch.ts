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

    /* Upserts a list of key, value tuples given an _id for the query itself */
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

    /* Check if values have been set for all references in a batch */
    batchHas(_id: string): boolean {
      if (this.has(_id)) {
        return _.every(this.val(_id), (itemId) => this.itemStore.has(itemId));
      }
      return false;
    }

    /* Combines a list of _ids with the latest item values */
    batchVal(_id: string): TData[] {
      if (this.batchHas(_id)) {
        var idList = this.val(_id);
        return _.map(idList, (itemId) => this.itemStore.val(itemId));
      }
    }

    /* Batch upserts based on a promise, updates dataStatus accordingly */
    batchFetch(_id: string, promise: JQueryPromise<[string, TData][]>) {
      var batchPromise = promise.then(function(pairList) {
        return _.map(pairList, (pair) => pair[0]);
      });

      // This updates batch store
      this.fetch(_id, batchPromise);

      // Update items stores too. Use the itemStore's fetch rather than
      // upsert directly so we can take advantage of dataStatus handling code
      promise.done((pairList) => {
        _.each(pairList, (pair) => {
          this.itemStore.fetch(pair[0],
            $.Deferred().resolve(pair[1]).promise());
        });
      });
    }
  }
}