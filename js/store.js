/*
  Local storage using JSON serialization on top of the native string-based
  storage. This cache persists from one session to another.

  Values can be inspected and deleted with Firebug.
  Go to the DOM tab and scroll down to "localStorage".
*/

var store = (function() {
  var mod = {};

  mod.set = function(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  };

  mod.get = function(k) {
    var s = localStorage.getItem(k);
    var x;
    if (s) {
      try {
        x = JSON.parse(s);
      }
      catch (e) {
        log ("Cannot parse cached data stored under key '"+ k +"': "+ s);
      }
    }
    return x;
  };

  mod.remove = function(k) {
    localStorage.removeItem(k);
  };

  mod.clear = function() {
    localStorage.clear();
  };

  return mod;
})();
