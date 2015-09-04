module Esper.Util {
  function unsafePreparePrintable(x : any, parents, maxDepth: number) {
    if (parents.length >= maxDepth) {
      return "[MAX DEPTH]";
    } else if (parents.length > 0 && x instanceof Window) {
      return "[WINDOW]";
    } else if (List.mem(parents, x)) {
      return "[CYCLE]";
    } else {
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

      case "[object Error]":
        return unsafePreparePrintable({
          name: x.name,
          message: x.message
        }, parents, maxDepth);

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
    if (x === undefined) {
      return "undefined";
    } else if (typeof x === "string") {
      return x;
    } else {
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
      if (f() !== true) {
        setTimeout(function() {
          repeatUntil(maxAttempts - 1, delayMs, f);
        }, delayMs);
      }
    }
  }

  /* Run the given function f() every delayMs milliseconds. */
  export function every(delayMs: number,
                        f: () => void,
                        firstTime = true) {
    setTimeout(function() {
      every(delayMs, f, false);
      f();
    }, delayMs);
    if (firstTime) f();
  }

  /*
    Execute a callback after a click, focus or keydown event,
    a certain delay after the last of those events.

    In other words, wait until the user is done typing for running the
    given function.
  */
  export function afterTyping(elt: JQuery, delayMs: number, func) {
    var lastPressed = Date.now(); // date in milliseconds
    function callback(event) {
      var t1 = lastPressed;
      var t2 = Date.now();
      if (lastPressed >= t2) {
        lastPressed = lastPressed + 1;
      } else {
        lastPressed = t2;
      }
      var lastPressed0 = lastPressed;
      window.setTimeout(function() {
        var isEnterKey = (event.which === 13 || event.keyCode === 13);
        var isEscKey = (event.which === 27 || event.keyCode === 27);
        if (lastPressed0 === lastPressed && !isEnterKey && !isEscKey) func();
      }, delayMs);
    }

    elt
      .unbind("click")
      .click(callback)
      .unbind("focus")
      .focus(callback)
      .unbind("keydown")
      .keydown(callback);
  }

  export function randomString() {
    return Math.random().toString(36).slice(2);
  }

  /* Inspect DOM tree */
  export function findTextInDom(text: string) {
    var sel: any[] = <any> $(":contains(" + JSON.stringify(text) + ")");
    List.iter(sel, function(elt, i) {
      Esper.Log.d("========= [" + i + "] =========", $(elt).text());
    });
  }

  export interface PathToNode {
    path: string;
    node: any;
  }

  /* Inspect arbitrary JavaScript object such as 'window'. */
  export function find(
    x: any,
    predicate: { (any): boolean },
    maxDepth = 10
  ): PathToNode[] {

    var acc: PathToNode[] = [];

    var longestPath = "";
    var longestPathLength = 0;

    function aux(x,
                 path: string,
                 parents: any[]) {

      var depth = parents.length + 1;
      if (depth > longestPathLength) {
        longestPath = path;
        longestPathLength = depth;
      }

      if (depth > maxDepth) {
        return;

      } else if (parents.length > 0 && x instanceof Window) {
        return;

      } else if (List.mem(parents, x)) {
        return;

      } else {

        if (predicate(x)) {
          acc.push({ path: path, node: x });
        } else {

          var type = Object.prototype.toString.call(x);
          switch(type) {

          case "[object Array]":
            var newParents = List.append(parents, [x]);
            List.iter(x, function(child, i) {
              aux(child, path + "[" + i + "]", newParents);
            });
            break;

          case "[object Object]":
          case "[object global]": // e.g. the window object
            var newParents = List.append(parents, [x]);
            for (var k in x) {
              aux(x[k], path + "." + k, newParents);
            };
            break;

          case "[object Function]":
          case "[object Error]":
            break;

          /* Standard JSON atoms */
          case "[object Null]":
          case "[object Boolean]":
          case "[object Number]":
          case "[object String]":
            break;

          /* Other known types supported by JSON.stringify */
          case "[object Date]":
            break;

          /* Known unsupported types */
          case "[object Undefined]":
            break;

          /* Unknown types */
          default:
          }
        }
      }
    }

    aux(x, "", []);

    Log.d("Longest path: " + longestPath);

    return acc;
  }

  /* Same as find() but prints the results nicely */
  export function search(
    x: any,
    predicate: { (any): boolean },
    maxDepth = 10
  ) {
    Log.d(toString(find(x, predicate, maxDepth), maxDepth));
  }

  /*
    Prevent the propagation of the click event to the parent element.
  */
  export function preventClickPropagation(elt: JQuery) {
    elt.click(function(event) { event.stopPropagation(); });
  }

  export function nameOfPlan(id: string /* planid */) {
    return id.replace(/(.*)_\d+$/, "$1").replace("_", " ");
  }
}
