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

  mod.toString = function(x) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x
    else
      return JSON.stringify(x, undefined, 2);
  }

  mod.log = function(x) {
    if (console && console.log)
      console.log(mod.toString(x));
  }

  return mod;
})();
