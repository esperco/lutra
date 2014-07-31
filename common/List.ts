/*
  List operations, similar to those used in OCaml, on Javascript arrays.
*/

module Esper.List {

  /* copy */
  export function copy(a) { return a.slice(0); };

  /* reversal */
  export function rev(a) { return a.reverse(); };

  /* sort into a new array */
  export function sort(a, cmp) {
    var b = copy(a);
    b.sort(cmp);
    return b;
  }

  /* iterate over each element (foreach) */
  export function iter(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++)
      f(a[i], i);
  };

  /* concatenation of a list of lists e.g. concat([a, b, c]) */
  export function concat(aa) {
    var acc = [];
    iter(aa, function(a) {
      acc = acc.concat(a);
    });
    return acc;
  };

  /* concatenation of lists passed as arguments e.g append(a, b, c) */
  export function append(...a: any[]) {
    return concat(arguments);
  };

  /* one-to-one mapping */
  export function map(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i], i);
    return b;
  };

  /* map, remove null elements */
  export function filterMap(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++) {
      var x = f(a[i], i);
      if (x !== null) {
        b.push(x);
      }
    }
    return b;
  };

  /* keep only elements that satisfy the predicate */
  export function filter(a, f) {
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

  /* return the first element that satisfies the give predicate */
  export function find(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return a[i];
      }
    }
    return null;
  };

  /* return true if at least one element satisfies the given predicate */
  export function exists(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true)
        return true;
    }
    return false;
  };

  /* return true iff every element satisfies the given predicate */
  export function forAll(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) !== true)
        return false;
    }
    return true;
  };

  /* return true if at least one element equals the given element */
  export function mem(a, x) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (a[i] === x) {
        return true;
      }
    }
    return false;
  };

  /* replace by x all elements that match the predicate f */
  export function replace(a, x, f) {
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
  export function ofTable(tbl) {
    var a = [];
    for (var k in tbl)
      a.push(tbl[k]);
    return a;
  };

  /* convert a list of values into an object keyed by strings;
     If the values are not strings, a function getKey must be provided
     which will extract a string key from each value */
  export function toTable(a, getKey) {
    var get = getter(getKey);
    var tbl = {};
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
  export function union(a, b, getKey) {
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
  export function unique(a, getKey) {
    return union(a, [], getKey);
  }

  /*
    intersection of two lists
    (elements occurring in both lists)
  */
  export function inter(a, b, getKey) {
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
  export function diff(a, b, getKey) {
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
