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
  }

  /* one-to-one mapping */
  mod.map = function(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i], i);
    return b;
  }

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
  }

  /* return the first element that satisfies the give predicate */
  mod.find = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i], i) === true) {
        return a[i];
      }
    }
    return null;
  }

  /* return true if at least one element satisfies the given predicate */
  mod.exists = function(a, f) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (f(a[i]), i) {
        return true;
      }
    }
    return false;
  }

  /* return true if at least one element equals the given element */
  mod.mem = function(a, x) {
    var len = a.length;
    for (var i = 0; i < len; i++) {
      if (a[i] === x) {
        return true;
      }
    }
    return false;
  }

  return mod;
}());
