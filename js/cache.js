/*
  Cache designed for data retrieved over HTTP.
  It allows values to be wrapped into CanJS observables,
  such that one change in a value is immediately reflected
  in all its views.
*/

var cache = (function() {
  var mod = {};

  /*
    Take a time-to-live in seconds and an object providing the methods:
    - get(key): compute a value
    - wrap(new value): wrap a new value (e.g. make it an observable)
    - update(old wrapped value, new value): modify existing value in place
    - destroy(old wrapped value): terminate a value

    Provide the following:
    - getCached(key): get a wrapped value, preferrably from the cache
    - setCached(key, new value): set a value locally, without calling get()
    - removeCached(key): remove a value from the cache

    get and getCached return Deferred values as defined by jQuery.
  */
  mod.create = function (ttl, missingTtl, access) {
    var cache = {};

    /* just write into the table */
    function cacheSet(k, v) {
      cache[k] = {
        expires: unixtime.now() + ttl,
        v: v
      };
    }

    /* just write into the table */
    function cacheSetMissing(k) {
      if (missingTtl > 0)
        cache[k] = {
          expires: unixtime.now() + missingTtl,
          v: null
        };
    }

    function defer(x) {
      var dfd = new $.Deferred();
      dfd.resolve(x);
      return dfd;
    }

    /* force-update a value in the cache, return wrapped value */
    function setCached(k, v) {
      var x = cache[k];
      var w0 = x ? x.v : null;
      if (v) {
        var w = w0 ? access.update(w0, v) : access.wrap(v);
        cacheSet(k, w);
        return w;
      }
      else {
        if (w0)
          access.destroy(w0);
        cacheSetMissing(k);
        return null;
      }
    }

    /* force-get the current value, update the cache */
    function force(k) {
      return access.get(k)
        .then(function(v) {
          return setCached(k, v);
        });
    }

    /* get cached value if available, otherwise get the current value */
    function getCached(k) {
      var x = cache[k];
      if (x && x.expires < unixtime.now()) {
        return defer(x.v);
      }
      else
        return force(k);
    }

    /* force-remove a value from the cache */
    function removeCached(k) {
      return setCached(k, null);
    }

    return {
      getCached: getCached,
      setCached: setCached,
      removeCached: removeCached
    }
  }

  return mod;
})();
