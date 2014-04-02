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

  mod.option = function(optValue, defaultValue) {
    if (mod.isDefined(optValue))
      return optValue;
    else
      return defaultValue;
  };

  mod.isString = function(x) {
    return typeof x === "string";
  };

  mod.isNumber = function(x) {
    return typeof x === "number";
  };

  mod.isNonEmptyString = function(x) {
    return mod.isString(x) && x.length > 0;
  };

  mod.isNumber = function(x) {
    return typeof x === "number";
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

  mod.copyObject = function(x) {
    return mod.mergeObjects(x);
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

  /* dropdownToggle.dropdown("show") is not supported
     by Bootstrap at this time */
  mod.showDropdown = function(dropdownToggle) {
    if (!dropdownToggle.parent().hasClass("open"))
      dropdownToggle.dropdown("toggle");
  };

  /* dropdownToggle.dropdown("hide") is not supported
     by Bootstrap at this time */
  mod.hideDropdown = function(dropdownToggle) {
    if (dropdownToggle.parent().hasClass("open"))
      dropdownToggle.dropdown("toggle");
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
