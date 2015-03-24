/*
  Utilities for asynchronous computations (jQuery Deferred objects returned
  by HTTP calls)
*/

module Esper.Promise {

  /* wrap an already-computed value into a Promise object,
     indicating a successful computation. */
  export function defer<T>(x : T) : JQueryPromise<T> {
    var dfd = new $.Deferred();
    dfd.resolve(x);
    return dfd;
  }

  /* wrap an already-computed value into a Promise object,
     indicating a failed computation. */
  export function fail<T>(x : T) : JQueryPromise<T> {
    var dfd = new $.Deferred();
    dfd.reject(x);
    return dfd;
  }

  /** Wrap a function into a promise, passing in resolve and reject as
   *  functions. Kind of like an ugly callCC.
   *
   *  I would write out a full type for this, but TypeScript makes it
   *  too much of a pain to get correct.
   */
  export function wrap<T>(body): JQueryPromise<T> {
    return new $.Deferred(function (resolve, reject) {
      body(resolve, reject);
    });
  }

  /* take a list of deferred computations and
     return a deferred list of the results */
  export function join<T>(a : JQueryPromise<T>[]) : JQueryPromise<T[]> {
    var len = a.length;
    var b : T[] = [];
    function next(i : number) {
      if (i < len) {
        return a[i]
          .then(
            /* upon success */
            function(x) {
              b[i] = x;
              return next(i+1);
            },
            /* upon failure we keep going anyway */
            function() {
              b[i] = null;
              return next(i+1);
            }
          )
      }
      else
        return defer(b);
    }
    return next(0);
  };

}
