/*
  Various simple utilities
*/

var util = (function () {
  var mod = {};

  // Return a random alphanumeric string
  mod.randomString = function() {
    return Math.random().toString(36).slice(2);
  }

  mod.isArray = function(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
  }

  mod.isObject = function(x) {
    return Object.prototype.toString.call(x) === "[object Object]";
  }

  mod.map = function(a, f) {
    var b = [];
    var len = a.length;
    for (var i = 0; i < len; i++)
      b[i] = f(a[i]);
    return b;
  }

  function preparePrintableObject(x) {
    var y = {};
    for (var k in x)
      y[k] = preparePrintable(x[k]);
    return y;
  }

  function preparePrintable(x) {
    var s = Object.prototype.toString.call(x);
    if (s === "[object Array]")
      return mod.map(x, preparePrintable);
    else if (s === "[object Object]")
      return preparePrintableObject(x);
    else if (s === "[object Function]")
      return s;
    else
      return x;
  }

  mod.toString = function(x) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x
    else
      return JSON.stringify(preparePrintable(x), undefined, 2);
  }

  return mod;
})();
