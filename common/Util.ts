module Esper.Util {
  function unsafePreparePrintable(x : any, parents, maxDepth: number) {
    if (parents.length >= maxDepth)
      return "[MAX DEPTH]";
    else if (parents.length > 0 && x instanceof Window)
      return "[WINDOW]";
    else if (List.mem(parents, x))
      return "[CYCLE]";
    else {
      var type = Object.prototype.toString.call(x);
      switch(type) {

      case "[object Array]":
        var cellParents = List.append(parents, [x]);
        return List.map(x, function(elt) {
          return preparePrintable(elt, cellParents, maxDepth);
        });

      case "[object Object]":
      case "[object global]": // e.g. the window object
        return preparePrintableObject(x, parents, maxDepth);

      case "[object Function]":
        return type;

      /* Standard JSON atoms */
      case "[object Null]":
      case "[object Boolean]":
      case "[object Number]":
      case "[object String]":
        return x;

      /* Other known types supported by JSON.stringify */
      case "[object Date]":
        return x;

      /* Known unsupported types */
      case "[object Undefined]":
        return type;

      /* Unknown types */
      default:
        return type;
      }
    }
  }

  function preparePrintable(x : any, parents, maxDepth) {
    try {
      return unsafePreparePrintable(x, parents, maxDepth);
    }
    catch(e) {
      return "[EXCEPTION]";
    }
  }

  function preparePrintableObject(x, parents, maxDepth) {
    var y : any = {};
    var fieldParents = List.append(parents, [x]);
    for (var k in x) {
      var fieldVal = x[k];
      y[k] = preparePrintable(fieldVal, fieldParents, maxDepth);
    }
    return y;
  }

  export function toString(x, maxDepth: number = 10) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x;
    else {
      var prep = preparePrintable(x, [], maxDepth);
      return JSON.stringify(prep, undefined, 2);
    }
  }

  /* Call the given function f() until it returns true or throws an exception,
     every delayMs milliseconds, at most maxAttempts times. */
  export function repeatUntil(maxAttempts: number,
                              delayMs: number,
                              f: () => boolean) {
    if (maxAttempts >= 1) {
      if (f() !== true)
        setTimeout(function() {
          repeatUntil(maxAttempts - 1, delayMs, f);
        }, delayMs);
    }
  }

  /* Run the given function f() every delayMs milliseconds.
     Exceptions are logged and otherwise ignored. */
  export function every(delayMs: number,
                        f: () => void) {
    setTimeout(function() {
      try {
        f();
        try {
          every(delayMs, f)
        }
        catch(e) {
          Log.e("Exception thrown by Util.every():", e);
        }
      }
      catch(e) {
        Log.e("Exception thrown by callback passed to Util.every():", e);
        every(delayMs, f);
      }
    }, delayMs);
  }

  export function afterTyping(elt: JQuery, delayMs: number, func) {
    var lastPressed = Date.now(); // date in milliseconds
    elt
      .unbind("keydown")
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
  }

  export function randomString() {
    return Math.random().toString(36).slice(2);
  }
}
