/*
  Provides Model.CappedStore, a version of Model.Store with a capped number
  of keys (useful for caching). CappedStore keys are processed in a FIFO-like
  manner.
*/

/// <reference path="./Model.ts" />
/// <reference path="./Util.ts" />

module Esper.Model {

  // Allow default to be changed
  export var DEFAULT_CAP = 100;

  export class CappedStore<TData> extends Store<TData> {
    // Max number of items to store
    cap: number;

    // FIFO queue of _ids
    capList: string[];

    constructor(cap=DEFAULT_CAP) {
      super();
      this.cap = cap;
    }

    reset(): void {
      super.reset();
      this.capList = [];
    }

    set(_id: string, tuple: [TData, StoreMetadata]): void;
    set(_id: string, data: TData, metadata?: StoreMetadata): void;
    set(_id: string, firstArg: any, secondArg?: any): void {
      super.set(_id, firstArg, secondArg);
      var aliases = this.aliases;
      var shift = Util.pushToCapped(this.capList, _id, this.cap,
        function(a, b): boolean {
          return (aliases[a] || a) === (aliases[b] || b);
        });
      if (shift) {
        // Don't call this.remove because we don't necessarily want to emit
        // a change event if the element is already rendered in the DOM. Just
        // remove from internal data reference.
        delete this.data[(<string> shift)];
      }
    }

    remove(_id: string): void {
      super.remove(_id);
      this.capList = _.without(this.capList, _id);
    }
  }

}