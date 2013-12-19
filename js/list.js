/*
  List operations, similar to those used in OCaml, on Javascript arrays.
*/

var list = (function() {
  var mod = {};

  /* iterate over each element (foreach) */
  mod.iter = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++)
      f(a[i], i);
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

  /* shallow copy of a list */
  mod.copy = function(a) {
    return a.slice(0);
  };

  /* convert object into a list of its keys */
  mod.ofTable = function(tbl) {
    var a = [];
    for (var k in tbl)
      a.push(k);
    return a;
  };

  /* convert a list of strings into an object keyed by these strings;
     values are set to true. */
  mod.toTable = function(a) {
    var tbl = {};
    mod.iter(a, function(k) {
      tbl[k] = true;
    });
    return tbl;
  };

  /*
    union of two lists of strings
    (strings occurring in either list, without duplicates)
  */
  mod.union = function(a, b) {
    var tbl = mod.toTable(a);
    var resTbl = {};
    var c = [];
    for (var k in tbl)
      c.push(k);
    mod.iter(b, function(k) {
      if (! tbl[k] && ! resTbl[k]) {
        c.push(k);
        resTbl[k] = true;
      }
    });
    return c;
  };

  /*
    remove duplicates from a list of strings
  */
  mod.unique = function(a) {
    return mod.union(a, []);
  };

  /*
    intersection of two lists of strings
    (strings occurring in both lists)
  */
  mod.inter = function(a, b) {
    var tbl = mod.toTable(b);
    return mod.filter(a, function(k) {
      return tbl[k];
    });
  };

  /*
    set difference of two lists of strings
    (strings occurring in the first list but not in the second list)
  */
  mod.diff = function(a, b) {
    var tbl = mod.toTable(b);
    return mod.filter(mod.unique(a), function(k) {
      return ! tbl[k];
    });
  };

  var l1 = ["a", "c", "a", "b", "d"];
  var l2 = ["c", "w", "c", "y"];

  mod.tests = [
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
                ["a", "c", "b", "d"])
  ];

  return mod;
}());
