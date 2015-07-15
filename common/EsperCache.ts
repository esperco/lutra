/**
   A cache keyed by strings.

   It can be used for any kind of values, including promises.

   Sample usage:

   var ttl = 300; // maximum age of a cached entry, in seconds

   // The function we provide to calculate and recalculate values from keys
   function fetch(teamid: string) {
     return Api.getPreferences(teamid);
   }

   var prefCache = new Cache.T< JQueryPromise<ApiT.Preferences> >(ttl, fetch);

   Getting values is done with prefCache.get(k)
*/

module Esper.EsperCache {
  interface CacheEntry<E> {
    value : E;
    created : Date;
  }

  export class T<E> {
    private cache : { [key: string]: CacheEntry<E> };
    private fetch : (key: string) => E;
    private ttl_seconds : number;

    constructor(ttl_seconds: number,
                fetch: (key: string) => E) {
      this.cache = {};
      this.fetch = fetch;
      this.ttl_seconds = ttl_seconds;
    }

    get(key: string): E {
      var entry = this.cache[key];
      if (entry && this.checkValidity(entry)) {
        return entry.value;
      }
      else {
        var t = new Date ();
        var newEntry: CacheEntry<E> = {
          value: this.fetch(key),
          created: t
        };
        this.cache[key] = newEntry;
        return newEntry.value;
      }
    }

    private checkValidity(entry: CacheEntry<E>) {
      var t1 = entry.created.getTime();
      var t2 = Date.now();
      var age_ms = t2 - t1;
      var isValid = (age_ms / 1000) < this.ttl_seconds;
      return isValid;
    }

  }

  /**************************************************************************/
  /* Test function - must return successfully */
  export function test() {
    var ttl = 0.5;

    /* This is used to return a different value each time fetch() is called */
    var counter = 0;
    function generator() {
      return counter++;
    }

    function fetch(k: string): number {
      return generator();
    }

    var cache = new T<number>(ttl, fetch);

    Log.assert(cache.get("a") === 0);
    Log.assert(cache.get("b") === 1);
    Log.assert(cache.get("a") === 0);
    Log.assert(cache.get("b") === 1);
    setTimeout(function() {
      Log.assert(cache.get("b") === 2);
      Log.assert(cache.get("a") === 3);
    }, 1000);
  }
}
