/*
  Module for queuueing API calls that need to proceed sequentially (e.g. in
  order to avoid race conditions).
*/

/// <reference path="./Log.ts" />

module Esper.Queue {
  // A QueueFn is just a callable that returns a promise
  export interface QueueFn<T> {
    (x?: T): JQueryPromise<T>
  }

  interface IQMap<T> {
    [index: string]: Array<QueueFn<T>>;
  }

  interface IDMap<T> {
    [index: string]: JQueryDeferred<T>;
  }

  /*
    Global shared map of queues (which are themselves just lists of QueueFns.
  */
  export var QMap: IQMap<any> = {};

  /*
    Global shared map of the deferred object used to tracking the state
    of the overall queue itself. These deferreds resolve when a queue
    empties and are reset when adding a new function to an empty queue.
  */
  export var DMap: IDMap<any> = {};

  // Reset for testing
  export function reset() {
    QMap = {};
    DMap = {};
  }

  /*
    Adds a function to a queue for a particular key. If there are no pending
    promises for this queued key, the function is invoked immediately. If the
    function returns a promise, future enqueued functions under this queue
    will not be called until that promise resolves or rejects.

    Returns a promise that resolves when the entire queue has been resolved
    and rejects when any promise has been rejected.
  */
  export function enqueue<T>(key: string, fn: QueueFn<T>): JQueryPromise<T> {
    // Ensure list exists under this key
    var queue = QMap[key] = QMap[key] || [];
    queue.push(fn);

    // If there's no pending deferred, start queue
    var dfd = DMap[key];
    if (!dfd || dfd.state() !== "pending") {
      dfd = DMap[key] = $.Deferred<T>();
      advanceQueue(key);
    }
    return dfd.promise();
  }

  // Callback tied to promise to advance a queue on failure
  function advanceQueue(key: string, lastResult?: any) {
    var queue = QMap[key];
    if (! queue) {
      Log.e("advanceQueue called on non-existent queue");
      return;
    }

    var dfd = DMap[key];
    if (! dfd) {
      Log.e('advanceQueue called without pending deferred');
      return;
    }

    if (! queue.length) {  // Empty queue => resolve deferred promise
      dfd.resolve(lastResult);
      delete DMap[key];
      return;
    }

    var next = queue.shift();
    var promise = next(lastResult);

    /*
      It's possible for a QueueFn to fail to return a promise, in which case
      just process until we have to wait for a promise to finish or the queue
      empties.
    */
    if (promise) {
      promise
        .done((res: any) => advanceQueue(key, res))
        .fail((err) => {
          dfd.reject(err);

          // Reset queue since later functions may have been dependent on
          // earlier queued function
          delete DMap[key];
          QMap[key] = [];
        });
    } else {
      advanceQueue(key);
    }
  }
}
