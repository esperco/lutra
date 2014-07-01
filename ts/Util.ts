module Util {
  function preparePrintable(x : any) {
    var s = Object.prototype.toString.call(x);
    if (s === "[object Array]")
      return x.map(preparePrintable);
    else if (s === "[object Object]")
      return preparePrintableObject(x);
    else if (s === "[object Function]")
      return s;
    else
      return x;
  }

  function preparePrintableObject(x) {
    var y : any = {};
    for (var k in x)
      y[k] = preparePrintable(x[k]);
    return y;
  }

  export function toString(x : any) {
    if (x === undefined)
      return "undefined";
    else if (typeof x === "string")
      return x;
    else
      return JSON.stringify(preparePrintable(x), undefined, 2);
  };
}
