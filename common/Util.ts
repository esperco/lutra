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

  export function toString(x, maxDepth: number = 4) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x;
    else {
      var prep = preparePrintable(x, [], maxDepth);
      return JSON.stringify(prep, undefined, 2);
    }
  }
}
