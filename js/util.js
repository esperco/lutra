/*
  Various simple utilities
*/

var util = (function () {
  var mod = {};

  var undef;

  // Return a random alphanumeric string
  mod.randomString = function() {
    return Math.random().toString(36).slice(2);
  };

  mod.isNotNull = function(x) {
    return x !== undef && x !== null;
  };

  mod.isDefined = function(x) {
    return x !== undef;
  };

  mod.isString = function(x) {
    return typeof x === "string";
  };

  mod.isObject = function(x) {
    return Object.prototype.toString.call(x) === "[object Object]";
  };

  /*
    Merge two objects into one, from left to right.
    A new object is created, leaving the input untouched.
  */
  mod.mergeObjects = function(/* as many object arguments as you want */) {
    var l = arguments;
    var result = {};
    list.iter(l, function(obj) {
      if (mod.isObject(obj)) {
        for (var k in obj)
          result[k] = obj[k];
      }
      else {
        log("util.mergeObjects ignoring non-object:", obj);
      }
    });
    return result;
  };

  mod.toString = function(x) {
    return test.toString(x);
  }

  /* Element to focus on once the page is ready
     (currently active input). */
  var focusOn;

  /* Change the element to focus on. */
  mod.changeFocus = function(elt) {
    focusOn = elt;
    elt.focus(); /* this does nothing if the element is still hidden */
  };

  /* Unset the element to focus on. */
  mod.cancelFocus = function() {
    focusOn = null;
  };

  /* Focus */
  mod.focus = function() {
    if (mod.isNotNull(focusOn)) {
      focusOn.focus();
    }
  };

  /* Decode a string encode in hexadecimal */
  mod.hexDecode = function(hex) {
    var s = "";
    for (var i = 0; i < hex.length; i += 2)
      s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return s;
  };

  mod.tests = [
    test.expect(
      "mergeObjects",
      function() {
        var m = mod.mergeObjects({x:1, y:2}, {z:3, x:4});
        return m.x === 4 && m.y === 2 && m.z === 3;
      },
      null,
      true
    )
  ];

  return mod;
})();
