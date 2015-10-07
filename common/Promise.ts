/*
  Utilities for asynchronous computations (jQuery Deferred objects returned
  by HTTP calls)
*/

module Esper.Promise {

  /* wrap an already-computed value into a Promise object,
     indicating a successful computation. */
  export function defer<T>(x : T) : JQueryPromise<T> {
    var dfd = $.Deferred();
    dfd.resolve(x);
    return dfd;
  }

  /* wrap an already-computed value into a Promise object,
     indicating a failed computation. */
  export function fail<T>(x : T) : JQueryPromise<T> {
    var dfd = $.Deferred();
    dfd.reject(x);
    return dfd;
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
      else {
        return defer(b);
      }
    }
    return next(0);
  };

  /*
    Variant of join that fails if any its deferreds also fail -- unlike
    $.when, does not return until all promises complete.
  */
  export function join2(a: JQueryDeferred<any>[] | JQueryPromise<any>[]) {
    var len = a.length;
    var b = []; // Buffer
    var hasError = false;
    function next(i) {
      if (i < len) {
        return a[i]
          .then(
          /* upon success */
          function(x) {
            b[i] = x;
            return next(i + 1);
          },
          /* upon failure we keep going anyway */
          function(err) {
            hasError = true;
            b[i] = err;
            return next(i + 1);
          });
      }
      else if (hasError)
        return fail(b);
      else
        return defer(b);
    }
    return next(0);
  };

  export function ignore<T>(x : JQueryPromise<T>) : JQueryPromise<void> {
    return x.then(function() { return; });
  }

}
