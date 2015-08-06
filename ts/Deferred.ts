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

  /* Take a list of deferred computations and return a deferred list of the 
     results. Takes an optional failure boolean that fails the joined
     computation if any of its component computations fail. */
  export function join(a: JQueryDeferred<any>[]|JQueryPromise<any>[], 
                       failOnAny?: boolean) {
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
              return next(i+1);
            },
            /* upon failure we keep going anyway */
            function(err) {
              b[i] = err;
              return next(i+1);
            }
          )
      }
      else if (hasError && failOnAny)
        return fail(b);
      else
        return defer(b);
    }
    return next(0);
  };

}
