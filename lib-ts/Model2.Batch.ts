/// <reference path="./Model2.ts" />

module Esper.Model2 {

  // Interface used for passsing batch data to BatchStore
  export interface BatchVal<ItemKey, ItemData> {
    itemKey: ItemKey,
    data: Option.T<ItemData>,
    opts?: Model2.StoreOpts<ItemKey>
  }

  export class BatchStore<BatchKey, ItemKey, ItemData>
    extends Store<BatchKey, ItemKey[]>
  {
    itemStore: Store<ItemKey, ItemData>;

    constructor(itemStore: Store<ItemKey, ItemData>, opts?: {
      // Max number of keys to store
      cap?: number
    }) {
      super(_.extend({
        // Normalize empty data to None
        validate: (keys: ItemKey[]) => keys.length > 0
      }, opts));
      this.itemStore = itemStore;
    }

    batchSet(batchKey: BatchKey,
             batchValOpt: Option.T<BatchVal<ItemKey, ItemData>[]>,
             opts?: Model2.StoreOpts<BatchKey>) {
      var keys: ItemKey[] = [];

      this.transact(() => {
        var keyOpt = batchValOpt.flatMap((batchVals) => {
          this.itemStore.transact(() => {
            _.each(batchVals, (batchVal) => {
              if (batchVal.opts) {
                this.itemStore.set(batchVal.itemKey, batchVal.data,
                                   batchVal.opts);
              } else {
                this.itemStore.set(batchVal.itemKey, batchVal.data);
              }
              keys.push(batchVal.itemKey);
            });
          });
          return Option.wrap(keys);
        });

        if (opts) {
          this.set(batchKey, keyOpt, opts);
        } else {
          this.set(batchKey, keyOpt);
        }
      });
    }

    batchGet(batchKey: BatchKey) {
      return this.get(batchKey)
        .flatMap((x) => x.data)
        .flatMap((d) => Option.wrap(_.map(d,
          (k) => this.itemStore.get(k)
        )))
        .flatMap((l) => _.find(l, (i) => i.isNone()) ?
          Option.none<typeof l>() :
          Option.wrap(l)
        );
    }

    batchFetch(batchKey: BatchKey,
               promise: JQueryPromise<Option.T<BatchVal<ItemKey, ItemData>[]>>)
    {
      var batchPromise = promise.then(function(optBatchVals) {
        return optBatchVals.flatMap((vals) => vals.length ?
          Option.wrap(_.map(vals, (v) => v.itemKey)) :
          Option.none<ItemKey[]>());
      });

      // This updates batch store
      this.fetch(batchKey, batchPromise);

      // Update items stores too. Use the itemStore's fetch rather than
      // upsert directly so we can take advantage of dataStatus handling code
      promise.done((optBatchVals) => optBatchVals.match({
        none: () => null, // Ignore if no values returned
        some: (batchVals) => this.itemStore.transact(() =>
          _.each(batchVals, (val) => this.itemStore.fetch(
            val.itemKey,
            $.Deferred().resolve(val.data).promise())))
      }));
    }
  }
}
