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

  function getter(optFunc) {
    return util.isDefined(optFunc) ? optFunc : function(x) { return x; };
  }

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

  var l1 = ["a", "c", "a", "b", "d"];
  var l2 = ["c", "w", "c", "y"];

  mod.tests = [
    test.expect("union",
                function() { return mod.union(l1, l2); }, null,
                ["a", "c", "b", "d", "w", "y"]),
    test.expect("unique",
                function() { return mod.unique(l1); }, null,
                ["a", "c", "b", "d"]),
  ];

  return mod;
}());
