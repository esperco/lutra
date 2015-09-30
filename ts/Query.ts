/*
  Use Query.Manager to retrieve data from cached sources (e.g. stores)
  and programmatically trigger udpates to those sources. The Manager
  embodies patterns useful for avoiding redundant API calls.
*/

/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="./Emit.ts" />
/// <reference path="./Model.ts" />

module Esper.Query {
  export interface Metadata {
    updateInProgress: boolean;
  }

  /*
    K is the interface for requested object. The Manager uses a deep comparison
    to de-duplicate requests so don't make this interface too complciated.

    V is the interface for the return value of the object from the store.
  */
  export abstract class Manager<K, V> extends Emit.EmitPipeBase {

    // The function implementing store retrieval
    protected abstract getData(key: K): V;

    /*
      The function implementing async requests from server -- function should
      not expect Queryable to update data store but should do it itself and
      return a promise that resolves when it is done.
    */
    protected abstract getAsync(key: K): JQueryPromise<any>;

    /*
      Given certain data in the store, should we call getAsync? By default,
      always returns true. Note that even if this returns true, Queryable will
      not make async call if one is already in progress.
    */
    protected shouldGetAsync(data: V, key: K): boolean {
      return true;
    }

    // Track calls that are in progress for different sets of args
    callsInProgress: K[];

    protected asyncInProgress(key: K): boolean {
      return !!_.find(this.callsInProgress, function(val) {
        return _.isEqual(val, key);
      });
    }

    // Called when async starts -- returns true on success, false if key is
    // already present in the callsInProgress array
    protected setAsyncInProgress(key: K): boolean {
      if (this.asyncInProgress(key)) {
        return false;
      } else {
        this.callsInProgress.push(key);
        return true;
      }
    }

    // Called when async done
    protected unsetAsyncInProgress(key: K): void {
      _.remove(this.callsInProgress, function(val): boolean {
        return _.isEqual(val, key);
      });
    }

    // Schedule an async update for a given key -- avoids duplication if one is
    // already in progress
    protected scheduleAsync(key: K): void {
      // Don't schedule async while another is ongoing. NB: This also prevents
      // us from scheduling asyncs when inside a litener responding to a
      // recent async change.
      if (! this.setAsyncInProgress(key)) {
        return;
      }

      var self = this;
      // Use separate callback with success and failure modes to ensure
      // unset only happens after any chained async events resolve as well.
      this.getAsync(key)
        .then(function() {
          self.unsetAsyncInProgress(key);
        }, function() {
          self.unsetAsyncInProgress(key);
        });
    }

    constructor(sources?: Emit.EmitBase[]) {
      super(sources);
      this.callsInProgress = [];
    }

    get(key: K): [V, Metadata] {
      var ret = this.getData(key);
      if (this.shouldGetAsync(ret, key)) {
        this.scheduleAsync(key);
      }

      var metadata: Metadata = {
        updateInProgress: this.asyncInProgress(key)
      };
      return [ret, metadata];
    }
  }
}