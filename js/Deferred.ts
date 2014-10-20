/*
  Utilities for asynchronous computations (jQuery Deferred objects returned
  by HTTP calls)
*/

module Deferred {

  /* wrap an already-computed value into a Deferred object,
     indicating a successful computation. */
  export function defer(x) {
    var dfd = (<any> $.Deferred()); // FIXME
    dfd.resolve(x);
    return dfd;
  }

  /* wrap an already-computed value into a Deferred object,
     indicating a failed computation. */
  export function fail(x) {
    var dfd = (<any> $.Deferred()); // FIXME
    dfd.reject(x);
    return dfd;
  }

  /* take a list of deferred computations and
     return a deferred list of the results */
  export function join(a) {
    var len = a.length;
    var b = [];
    function next(i) {
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
