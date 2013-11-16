/*
  Utilities for asynchronous computations (jQuery Deferred objects returned
  by HTTP calls)
*/

var deferred = (function() {
  var mod = {};

  /* wrap an already-computed value into a Deferred object */
  mod.defer(x) {
    var dfd = new $.Deferred();
    dfd.resolve(x);
    return dfd;
  }

  /* take a list of deferred computations and
     return a deferred list of the results */
  mod.join = function(a) {
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
        return mod.defer(b);
    }
    return next(0);
  };

  return mod;
}());
