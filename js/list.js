/*
  List operations, similar to those used in OCaml, on Javascript arrays.
*/

var list = (function() {
  var mod = {};

  /* copy */
  mod.copy = function(a) { return a.slice(0); };

  /* reversal */
  mod.rev = function(a) { return a.reverse(); };

  /* sort into a new array */
  mod.sort = function(a, cmp) {
    var b = mod.copy(a);
    b.sort(cmp);
    return b;
  }

  /* iterate over each element (foreach) */
  mod.iter = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++)
      f(a[i], i);
  };

  mod.concat = function(aa) {
    var acc = [];
    mod.iter(aa, function(a) {
      acc = acc.concat(a);
    });
    return acc;
  };

  /* one-to-one mapping */
  mod.map = function(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i], i);
    return b;
  };

  /* map, remove null elements */
  mod.filter_map = function(a, f) {
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
  mod.filter = function(a, f) {
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
  mod.find = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return a[i];
      }
    }
    return null;
  };

  /* return true if at least one element satisfies the given predicate */
  mod.exists = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i))
        return true;
    }
    return false;
  };

  /* return true if at least one element equals the given element */
  mod.mem = function(a, x) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (a[i] === x) {
        return true;
      }
    }
    return false;
  };

  /* replace by x all elements that match the predicate f */
  mod.replace = function(a, x, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++) {
      var x0 = a[i];
      b[i] = f(x0, i) ? x : x0;
    }
    return b;
  };

  /* shallow copy of a list */
  mod.copy = function(a) {
    return a.slice(0);
  };

  function getter(optFunc) {
    return util.isDefined(optFunc) ? optFunc : function(x) { return x; };
  };

  /* convert object into a list of its values */
  mod.ofTable = function(tbl) {
    var a = [];
    for (var k in tbl)
      a.push(tbl[k]);
    return a;
  };

  /* convert a list of values into an object keyed by strings;
     If the values are not strings, a function getKey must be provided
     which will extract a string key from each value */
  mod.toTable = function(a, getKey) {
    var get = getter(getKey);
    var tbl = {};
    mod.iter(a, function(v) {
      var k = get(v);
      tbl[k] = v;
    });
    return tbl;
  };

  /*
    union of two lists
    (elements occurring in either list, without duplicates)
  */
  mod.union = function(a, b, getKey) {
    var get = getter(getKey);
    var tbl = mod.toTable(a, getKey);
    var resTbl = {};
    var c = [];
    for (var k in tbl)
      c.push(tbl[k]);
    mod.iter(b, function(v) {
      var k = get(v);
      if (! util.isDefined(tbl[k]) && ! util.isDefined(resTbl[k])) {
        c.push(v);
        resTbl[k] = v;
      }
    });
    return c;
  };

  /*
    remove duplicates from a list
  */
  mod.unique = function(a, getKey) {
    return mod.union(a, [], getKey);
  };

  /*
    intersection of two lists
    (elements occurring in both lists)
  */
  mod.inter = function(a, b, getKey) {
    var get = getter(getKey);
    var tbl = mod.toTable(b, getKey);
    return mod.filter(mod.unique(a, getKey), function(v) {
      var k = get(v);
      return util.isDefined(tbl[k]);
    });
  };

  /*
    set difference of two lists
    (elements occurring in the first list but not in the second list)
  */
  mod.diff = function(a, b, getKey) {
    var get = getter(getKey);
    var tbl = mod.toTable(b, getKey);
    return mod.filter(mod.unique(a, getKey), function(v) {
      var k = get(v);
      return ! util.isDefined(tbl[k]);
    });
  };

  var l1 = ["a", "c", "a", "b", "d"];
  var l2 = ["c", "w", "c", "y"];

  mod.tests = [
    test.expect("concat",
                function() { return mod.concat([l1, l2]); }, null,
                ["a", "c", "a", "b", "d", "c", "w", "c", "y"]),
    test.expect("union",
                function() { return mod.union(l1, l2); }, null,
                ["a", "c", "b", "d", "w", "y"]),
    test.expect("inter",
                function() { return mod.inter(l1, l2); }, null,
                ["c"]),
    test.expect("diff",
                function() { return mod.diff(l1, l2); }, null,
                ["a", "b", "d"]),
    test.expect("unique",
                function() { return mod.unique(l1); }, null,
                ["a", "c", "b", "d"]),
    test.expect("replace",
                function() {
                  return mod.replace(l1, "X", function(x, i) {
                    return x === "a" && i > 0;
                  });
                }, null, ["a", "c", "X", "b", "d"])
  ];

  return mod;
}());
