/*
  Various simple utilities
*/

module Util {

  var undef;

  // Return a random alphanumeric string
  export function randomString() {
    return Math.random().toString(36).slice(2);
  };

  export function isNotNull(x) {
    return x !== undef && x !== null;
  };

  export function isDefined(x) {
    return x !== undef;
  };

  export function isString(x) {
    return typeof x === "string";
  };

  export function isObject(x) {
    return Object.prototype.toString.call(x) === "[object Object]";
  };

  /*
    Merge two objects into one, from left to right.
    A new object is created, leaving the input untouched.
  */
  export function mergeObjects(...l : any[]) {
    var result = {};
    List.iter(l, function(obj) {
      if (isObject(obj)) {
        for (var k in obj)
          result[k] = obj[k];
      }
      else {
        Log.p("util.mergeObjects ignoring non-object:", obj);
      }
    });
    return result;
  };

  export function toString(x) {
    return Test.toString(x);
  }

  /*
    Do something once the user has stopped typing for a certain number
    of milliseconds.
   */
  export function afterTyping(elt: JQuery,
                              delayMs: number,
                              func: () => void) {
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

  /* Element to focus on once the page is ready
     (currently active input). */
  var focusOn;

  /* Change the element to focus on. */
  export function changeFocus(elt) {
    focusOn = elt;
    elt.focus(); /* this does nothing if the element is still hidden */
  };

  /* Unset the element to focus on. */
  export function cancelFocus() {
    focusOn = null;
  };

  /* Focus */
  export function focus() {
    if (isNotNull(focusOn)) {
      focusOn.focus();
    }
  };

  /* Decode a string encode in hexadecimal */
  export function hexDecode(hex) {
    var s = "";
    for (var i = 0; i < hex.length; i += 2)
      s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return s;
  }

  export function validateEmailAddress(s: string) {
    var re = /\S+@\S+\.\S+/;
    return re.test(s);
  }

  export var tests = [
    Test.expect(
      "mergeObjects",
      function() {
        var m : any = mergeObjects({x:1, y:2}, {z:3, x:4});
        return m.x === 4 && m.y === 2 && m.z === 3;
      },
      null,
      true
    )
  ];

}
