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

  mod.isFunction = function(x) {
    return typeof x === "function";
  };

  mod.addFields = function(x, fields) {
    for (var k in fields)
      x[k] = fields[k];
  };

  mod.toString = function(x) {
    return test.toString(x);
  }

  mod.htmlEscape = function(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /*
    Do something once the user has stopped typing for a certain number
    of milliseconds.
   */
  mod.afterTyping = function(elt, delayMs, func) {
    var lastPressed; // date in milliseconds
    elt
      .unbind('keydown')
      .keydown(function() {
        var t1 = lastPressed;
        var t2 = Date.now();
        if (lastPressed >= t2)
          lastPressed = lastPressed + 1;
        else
          lastPressed = t2;
        var lastPressed0 = lastPressed;
        window.setTimeout(function() {
          if (lastPressed0 === lastPressed)
            func();
        }, delayMs);
      });
  };

  /* 0 -> "A", 1 -> "B", ... */
  mod.letterOfInt = function(n) {
    return String.fromCharCode(65 + n);
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

  mod.arrayUnique = function(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) obj[arr[i]] = arr[i];
    var ret = [];
    for (var j in obj) ret.push(obj[j]);
    return ret;
  };

  return mod;
})();
