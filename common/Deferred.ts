/*
  Utilities for asynchronous computations (jQuery Deferred objects returned
  by HTTP calls)
*/

module Esper.Deferred {

  /* wrap an already-computed value into a Deferred object,
     indicating a successful computation. */
  export function defer<T>(x : T) : JQueryDeferred<T> {
    var dfd = new $.Deferred();
    dfd.resolve(x);
    return dfd;
  }

  /* wrap an already-computed value into a Deferred object,
     indicating a failed computation. */
  export function fail<T>(x : T) : JQueryDeferred<T> {
    var dfd = new $.Deferred();
    dfd.reject(x);
    return dfd;
  }

  /* take a list of deferred computations and
     return a deferred list of the results */
  export function join<T>(a : JQueryDeferred<T>[]) : JQueryDeferred<T[]> {
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
    return <JQueryDeferred<T[]>> next(0);
  };

}
