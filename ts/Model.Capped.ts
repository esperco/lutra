/*
  Provides Model.CappedStore, a version of Model.Store with a capped number
  of keys (useful for caching). CappedStore keys are processed in a FIFO-like
  manner.
*/

/// <reference path="./Model.ts" />

module Esper.Model {

  // Allow default to be changed
  export var DEFAULT_CAP = 100;

  export class CappedStore<T> extends Store<T> {
    // Max number of items to store
    cap: number;

    constructor(cap=DEFAULT_CAP) {
      super();
      this.cap = cap;
    }
  }

}