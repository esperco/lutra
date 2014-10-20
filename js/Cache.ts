/*
  Cache designed for data retrieved over HTTP.
  It allows values to be wrapped into CanJS observables,
  such that one change in a value is immediately reflected
  in all its views.
*/

module Cache {

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
  export function create(ttl, missingTtl, access) {
    var cache = {};

    var get = access.get;
    var wrap = Util.isDefined(access.wrap) ?
      access.wrap : function(deferredV) {
        return deferredV;
      };
    var update = Util.isDefined(access.update) ?
      access.update : function(oldDeferredW, newDeferredV) {
        return newDeferredV;
      };
    var destroy = Util.isDefined(access.destroy) ?
      access.destroy : function(oldDeferredW) {};

    /* just deferred wrapped value into the table */
    function cacheSet(k, deferredW) {
      cache[k] = {
        expires: Unixtime.now() + ttl,
        w: deferredW
      };
    }

    /* just write into the table */
    function cacheSetMissing(k) {
      if (missingTtl > 0)
        cache[k] = {
          expires: Unixtime.now() + missingTtl,
          w: null
        };
      else
        delete cache[k];
    }

    function defer(x) {
      var dfd = new (<any> $.Deferred());
      dfd.resolve(x);
      return dfd;
    }

    /* force-update a value in the cache, return wrapped value */
    function setCached(k, deferredV) {
      var x = cache[k];
      var deferredW0 = Util.isDefined(x) ? x.w : null;
      if (Util.isDefined(deferredV)) {
        var deferredW = deferredW0 !== null ?
          update(deferredW0, deferredV) : wrap(deferredV);
        cacheSet(k, deferredW);
        return deferredW;
      }
      else {
        if (deferredW0 !== null)
          destroy(deferredW0);
        cacheSetMissing(k);
        return null;
      }
    }

    /* force-get the current value, update the cache */
    function force(k) {
      return setCached(k, get(k));
    }

    /* get cached value if available, otherwise get the current value */
    function getCached(k) {
      var x = cache[k];
      if (x && Unixtime.now() < x.expires) {
        return x.w;
      }
      else
        return force(k);
    }

    /* force-remove a value from the cache */
    function removeCached(k) {
      return setCached(k, undefined);
    }

    return {
      getCached: getCached,
      setCached: setCached,
      removeCached: removeCached
    }
  }

}
