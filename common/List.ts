/*
  List operations, similar to those used in OCaml, on Javascript arrays.
*/

module Esper.List {

  /* copy */
  export function copy(a: JQuery): JQuery;
  export function copy<T>(a: T[]): T[];
  export function copy(a: any): any { return a.slice(0); };

  /* reversal */
  export function rev<T>(a: T[]): T[] { return a.reverse(); };

  /* sort into a new array */
  export function sort<T>(a: T[], cmp: (x: T, y: T) => number): T[] {
    var b = copy(a);
    b.sort(cmp);
    return b;
  }

  export function sortStrings(a: string[]): string[] {
    var b = copy(a);
    b.sort();
    return b;
  }

  /* iterate over each element (foreach) */
  export function iter(a: JQuery, f: (x: HTMLElement, i?: number) => void);
  export function iter<T>(a: T[], f: (x: T, i?: number) => void);
  export function iter(a: any, f: any) {
    var len = a.length;
    for (var i = 0; i < len; i++)
      f(a[i], i);
  };

  /* concatenation of a list of lists e.g. concat([a, b, c]) */
  export function concat<T>(aa: T[][]): T[] {
    var acc = [];
    iter(aa, function(a) {
      acc = acc.concat(a);
    });
    return acc;
  };

  /* concatenation of lists passed as arguments e.g append(a, b, c) */
  export function append<T>(...a: T[][]): T[] {
    return concat(a);
  };

  /* one-to-one mapping */
  export function map<U>(a: JQuery, f: (x: HTMLElement, i?: number) => U): U[];
  export function map<T, U>(a: T[], f: (x: T, i?: number) => U): U[];
  export function map(a: any, f: any): any[] {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i], i);
    return b;
  };

  /* map, remove null or undefined elements */
  export function filterMap<U>(a: JQuery, f: (x: HTMLElement, i?: number) => U): U[];
  export function filterMap<T, U>(a: T[], f: (x: T, i?: number) => U): U[];
  export function filterMap(a: any, f: any): any[] {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++) {
      var x = f(a[i], i);
      if (x !== null && x !== undefined) {
        b.push(x);
      }
    }
    return b;
  };

  /* keep only elements that satisfy the predicate */
  export function filter(a: JQuery,
                         f: (x: HTMLElement, i?: number) => boolean): JQuery;
  export function filter<T>(a: T[], f: (x: T, i?: number) => boolean): T[];
  export function filter(a: any, f: any): any {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++) {
      var x = a[i];;
      if (f(x, i) === true) {
        b.push(x);
      }
    }
    return b;
  };

  /* return the first element that satisfies the given predicate */
  export function find<T>(a: T[], f: (x: T, i?: number) => boolean): T {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return a[i];
      }
    }
    return null;
  };

  /** Returns the index of the first element that satisfies the given
   *  predicated or -1 if no such element is found.
   */
  export function findIndex<T>(a: T[], f: (x: T, i?: number) => boolean): number {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return i;
      }
    }
    return -1;
  }

  /* return true if at least one element satisfies the given predicate */
  export function exists<T>(a: T[], f: (x: T, i?: number) => boolean): boolean {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return true;
      }
    }
    return false;
  };

  /* return true iff every element satisfies the given predicate */
  export function forAll<T>(a: T[], f: (x: T, i?: number) => boolean) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) !== true) {
        return false;
      }
    }
    return true;
  };

  /* return true if at least one element equals the given element */
  export function mem<T>(a: T[], x: T): boolean {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (a[i] === x) {
        return true;
      }
    }
    return false;
  };

  /* replace by x all elements that match the predicate f */
  export function replace<T>(a: T[], x: T, f: (x0: T, i?: number) => boolean):
  T[] {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++) {
      var x0 = a[i];
      b[i] = f(x0, i) ? x : x0;
    }
    return b;
  };

  function getter(optFunc) {
    return optFunc !== undefined ? optFunc : function(x) { return x; };
  };

  /* convert object into a list of its values */
  export function ofTable<T>(tbl: { [k: string]: T }): T[] {
    var a = [];
    for (var k in tbl)
      a.push(tbl[k]);
    return a;
  };

  /* convert a list of values into an object keyed by strings;
     If the values are not strings, a function getKey must be provided
     which will extract a string key from each value */
  export function toTable<T>(a: T[], getKey?: (x: T) => string):
  { [k: string]: T } {
    var get = getter(getKey);
    var tbl: { [k: string]: T } = {};
    iter(a, function(v) {
      var k = get(v);
      tbl[k] = v;
    });
    return tbl;
  };

  /*
    union of two lists
    (elements occurring in either list, without duplicates)
  */
  export function union<T>(a: T[], b: T[], getKey?: (x: T) => string): T[] {
    var get = getter(getKey);
    var tbl = toTable(a, getKey);
    var resTbl = {};
    var c = [];
    for (var k in tbl)
      c.push(tbl[k]);
    iter(b, function(v) {
      var k = get(v);
      if (tbl[k] === undefined && resTbl[k] === undefined) {
        c.push(v);
        resTbl[k] = v;
      }
    });
    return c;
  };

  /*
    remove duplicates from a list
  */
  export function unique<T>(a: T[], getKey?: (x: T) => string): T[] {
    return union(a, [], getKey);
  }

  /*
    intersection of two lists
    (elements occurring in both lists)
  */
  export function inter<T>(a: T[], b: T[], getKey?: (x: T) => string): T[] {
    var get = getter(getKey);
    var tbl = toTable(b, getKey);
    return filter(unique(a, getKey), function(v) {
      var k = get(v);
      return tbl[k] !== undefined;
    });
  }

  /*
    set difference of two lists
    (elements occurring in the first list but not in the second list)
  */
  export function diff<T>(a: T[], b: T[], getKey?: (x: T) => string): T[] {
    var get = getter(getKey);
    var tbl = toTable(b, getKey);
    return filter(unique(a, getKey), function(v) {
      var k = get(v);
      return tbl[k] === undefined;
    });
  };

/*
  var l1 = ["a", "c", "a", "b", "d"];
  var l2 = ["c", "w", "c", "y"];

  export var tests = [
    test.expect("concat",
                function() { return concat([l1, l2]); }, null,
                ["a", "c", "a", "b", "d", "c", "w", "c", "y"]),
    test.expect("union",
                function() { return union(l1, l2); }, null,
                ["a", "c", "b", "d", "w", "y"]),
    test.expect("inter",
                function() { return inter(l1, l2); }, null,
                ["c"]),
    test.expect("diff",
                function() { return diff(l1, l2); }, null,
                ["a", "b", "d"]),
    test.expect("unique",
                function() { return unique(l1); }, null,
                ["a", "c", "b", "d"]),
    test.expect("replace",
                function() {
                  return replace(l1, "X", function(x, i) {
                    return x === "a" && i > 0;
                  });
                }, null, ["a", "c", "X", "b", "d"])
  ];
*/
}
