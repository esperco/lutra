/*
  Utilities used to manage recently lists of recently visited items.
*/

module Esper.Visited {
  export var maxThreads = 5;
  export var maxEvents = 5;

  /*
    Not a method of Visited because Visited needs to be serialized as JSON.
  */
  export function eq<T>(a: Types.Visited<T>, b: Types.Visited<T>): boolean {
    if (a.id === undefined || b.id === undefined)
      return false;
    else
      return a.id === b.id;
  }

  /* Oldest first */
  export function cmp<T>(a: Types.Visited<T>, b: Types.Visited<T>): number {
    var xa = a.lastVisited;
    var xb = b.lastVisited;
    if (xa < xb)
      return -1;
    else if (xa > xb)
      return 1;
    else
      return 0; /* covers the case NaN !== NaN */
  }

  /*
    Merge two lists of visited items: removing duplicates and sort
    by recency, and keep at most <capacity> items.
  */
  export function merge<T>(a: Types.Visited<T>[],
                           b: Types.Visited<T>[],
                           capacity: number):
  Types.Visited<T>[] {
    var cache = new LRU.C<Types.Visited<T>>(capacity, eq);

    /* Remove old incompatible junk 2014-08-28 */
    var all = List.filter(List.append(a, b), function(x) {
      return x.lastVisited !== undefined;
    });

    var oldestFirst = List.sort(all, cmp);
    List.iter(oldestFirst, function(x) {
      cache.add(x);
    });

    return cache.all;
  }
}
