/*
  Module for queueing API calls that need to proceed sequentially (e.g. in
  order to avoid race conditions). Alternative interface to Esper.Queue
  designed to allow API calls to be combined.

  Built around the Queue2.Processor class. The Processor class is initalized
  with two functions -- a pre-processor that receives a list of arguments
  that have been queued up with the Processor and can return a modified
  list of arguments, and a processor that receives the shifted first item
  in the modified list and should return a promise. The Processor class will
  wait until the promise resolves before calling again.

  Like Queue.enqueue, the Processor can maintain separate queues using
  string keys.
*/

/// <reference path="./Option.ts" />

module Esper.Queue2 {

  interface IPreprocessFn<T> {
    (state: T[]): T[];
  }

  interface IProcessFn<T, P> {
    (item: T, last?: P): JQueryPromise<P>;
  }

  export class Processor<T, P> {
    preFn: IPreprocessFn<T>;
    processFn: IProcessFn<T, P>;
    stateMap: {
      [index: string]: T[];
    }
    deferredMap: {
      [index: string]: JQueryDeferred<P>;
    }

    constructor(processFn: IProcessFn<T, P>, preFn?: IPreprocessFn<T>) {
      this.preFn = preFn || ((x: T[]) => x);
      this.processFn = processFn;
      this.stateMap = {};
      this.deferredMap = {};
    }

    enqueue(key: string, item: T): JQueryPromise<P> {
      this.stateMap[key] = this.stateMap[key] || [];
      this.stateMap[key].push(item);

      var dfd = this.deferredMap[key];
      if (!dfd || dfd.state() !== "pending") {
        dfd = this.deferredMap[key] = $.Deferred<P>();
        this.advance(key);
      }
      return dfd.promise();
    }

    advance(key: string, lastResult?: P): void {
      var dfd = this.deferredMap[key];
      var state = this.stateMap[key];

      // No more items => resolve
      if (! state.length) {
        dfd.resolve(lastResult);
        return;
      }

      /*
        Has state => recursively process queued items
      */
      state = this.stateMap[key] = this.preFn(this.stateMap[key]);
      var promise = Option.wrap(lastResult).match({
        none: () => this.processFn(state.shift()),
        some: (l) => this.processFn(state.shift(), l)
      });
      if (promise) {
        promise
          .done((res: P) => this.advance(key, res))
          .fail((err) => {
            dfd.reject(err);

            // Reset queue since later functions may have been dependent on
            // earlier queued function
            delete this.deferredMap[key];
            delete this.stateMap[key];
          });
      }

      /*
        It's possible for the processFn to fail to return a promise, in which
        case just process until we have to wait for a promise to finish or the
        queue empties.
      */
      else {
        this.advance(key);
      }
    }
  }
}
