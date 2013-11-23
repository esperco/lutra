/*
  Various simple utilities
*/

var util = (function () {
  var mod = {};

  // Return a random alphanumeric string
  mod.randomString = function() {
    return Math.random().toString(36).slice(2);
  };

  mod.isNotNull = function(x) {
    return typeof x != "undefined" && x !== null;
  };

  mod.isDefined = function(x) {
    return typeof x != "undefined";
  };

  mod.isString = function(x) {
    return typeof x === "string";
  };

  mod.isArray = function(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
  };

  mod.isObject = function(x) {
    return Object.prototype.toString.call(x) === "[object Object]";
  };

  mod.addFields = function(x, fields) {
    for (var k in fields)
      x[k] = fields[k];
  };

  function preparePrintableObject(x) {
    var y = {};
    for (var k in x)
      y[k] = preparePrintable(x[k]);
    return y;
  }

  function preparePrintable(x) {
    var s = Object.prototype.toString.call(x);
    if (s === "[object Array]")
      return list.map(x, preparePrintable);
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

  function htmlEscape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return mod;
})();
