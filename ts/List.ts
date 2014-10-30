/*
  List operations, similar to those used in OCaml, on Javascript arrays.
*/

module List {

  /* iterate over each element (foreach) */
  export function iter(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++)
      f(a[i], i);
  };

  /* one-to-one mapping */
  export function map(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i], i);
    return b;
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

  /* return the first element that satisfies the give predicate */
  export function find<T>(a: T[], f: (x: T, i?: number) => boolean): T {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return a[i];
      }
    }
    return null;
  };

  function getter(optFunc) {
    return Util.isDefined(optFunc) ? optFunc : function(x) { return x; };
  }

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
      if (! Util.isDefined(tbl[k]) && ! Util.isDefined(resTbl[k])) {
        c.push(v);
        resTbl[k] = v;
      }
    });
    return c;
  };

  var l1 = ["a", "c", "a", "b", "d"];
  var l2 = ["c", "w", "c", "y"];

  export var tests = [
    Test.expect("union",
                function() { return union(l1, l2, undefined); }, null,
                ["a", "c", "b", "d", "w", "y"]),
  ];

}
