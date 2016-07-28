/// <reference path="./Log.ts" />

module Esper.Util {
  // Return a random alphanumeric string
  export function randomString() {
    return Math.random().toString(36).slice(2);
  };

  // Returns a rounded string version of a number
  export function roundStr(num: number, digits=0) {
    var adjust = Math.pow(10, digits);
    var str = (Math.round(num * adjust) / adjust).toFixed(digits);
    return Number(str).toString();
  }

  // Recursively freeze object on IE9 and up.
  export function deepFreeze<T>(o: T): T {
    // IE9 and below lacks freeze, so bounce out if it doesn't exist
    if (! Object.freeze) {
      return o;
    }

    // Ignore non-objects
    if (typeof o !== "object") {
      return o;
    }

    // Return if already frozen
    if (Object.isFrozen(o)) {
      return o;
    }

    // Shallow freeze of passed object
    Object.freeze(o);

    // Recursively freeze all sub-props -- note that this doesn't freeze
    // functions since typeof function !== "object", but we're presumably
    // not mutating functions
    Object.getOwnPropertyNames(o).forEach(function (prop) {
      if (o.hasOwnProperty(prop) &&
          (<any> o)[prop] !== null) {
        deepFreeze((<any> o)[prop]);
      }
    });

    return o;
  };

  // Push to a capped list -- removes duplicates -- returns shifted element
  // if cap reached or exceeded
  export function pushToCapped<T>(list: T[], newVal: T, cap: number,
                                  eq?: (a: T, b: T) => boolean): T|void
  {
    eq = eq || _.isEqual;
    _.remove(list, function(oldVal) {
      return eq(oldVal, newVal);
    });
    list.push(newVal);
    if (list.length > cap) {
      return list.shift();
    }
  }

  export function validateEmailAddress(s: string) {
    var re = /\S+@\S+\.\S+/;
    return re.test(s);
  }

  /* Decode a string encode in hexadecimal */
  export function hexDecode(hex: string) {
    var s = "";
    for (var i = 0; i < hex.length; i += 2)
      s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return s;
  }

  /* Reverse of above -- NB: Does not work with unicode at the moment */
  export function hexEncode(orig: string) {
    var hex = '';
    for(var i = 0; i < orig.length; i++) {
      hex += orig.charCodeAt(i).toString(16);
    }
    return hex;
  }

  /* Stable stringification of objects for comparison */
  export function cmpStringify(o: any): string {
    return JSON.stringify(tuplify(o));
  }

  /*
    Recursively converts objects to sorted nested lists of 2-tuples.
    Lack of strong typing isn't ideal, but should be OK if only used by
    cmpStringify to generate stable strings for identical objects.
  */
  function tuplify(o: any): any {
    if (typeof o !== "object") {
      return o;
    }

    if (o instanceof Date) {
      return o;
    }

    if (_.isFunction(o)) {
      return "function";
    }

    var keys = _.keys(o);
    keys.sort();

    return _.map(keys, function(k) {
      return [k, tuplify(o[k])];
    });
  }

  /*
    Get value of query string
    http://stackoverflow.com/a/901144
  */
  export function getParamByName(name: string, queryStr?: string): string {
    queryStr = queryStr || location.search;
    if (queryStr[0] !== "?") queryStr = "?" + queryStr;
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(queryStr);
    return (results === null ? "" :
      decodeURIComponent(results[1].replace(/\+/g, " ")));
  }

  // Normalize falsey values to null
  export function nullify<T>(a: T): T {
    return a ? a : null;
  }

  // Ensures var is not null, returns default otherwise
  export function some<T>(v: T, d?: T): T {
    if (_.isUndefined(v) || v === null) {
      Log.assert(!_.isUndefined(d) && d !== null, "Value must be defined")
      return d;
    } else {
      return v;
    }
  }

  /*
    Do something after a short delay. Ensures that only one function is
    pending for any given id.
  */
  var delayTimeouts: {[index: string]: number} = {};
  export function delayOne(id: string, fn: () => void, delay: number) {
    clearTimeout(delayTimeouts[id]);
    delayTimeouts[id] = setTimeout(fn, delay);
  }

  export function keyObj<T>(key: string, value: T): {
    [index: string]: T
  } {
    var ret: {[index: string]: T} = {};
    ret[key] = value;
    return ret;
  }


  /* Escape HTML */

  const entityMap: {[index: string]: string} = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  export function escapeHtml(s: string) {
    return String(s).replace(/[&<>"']/g, function (s) {
      return entityMap[s];
    });
  }

  export function escapeBrackets(s: string) {
    return String(s).replace(/[<>]/g, function (s) {
      return entityMap[s];
    });
  }

  // Typed version of $.when.apply($, array)
  export function when<T>(deferreds: (T | JQueryPromise<T>)[])
    : JQueryPromise<T[]>
  {
    return $.when.apply($, deferreds).then(

      // Convert ..args to args (typing ...args is annoying)
      function(...args: T[]) { return args; }
    )
  }

  /*
    Typed, functional switching, useful for React since if/else-if is clunky
    when using with React expressions

      declare var x: number;
      Util.match(x,
        [
          [1, "One"],
          [2, "Two"]
        ],
        "Not one or two"
      );

    Can also use custom matching:

      Util.match(x,
        [
          [1, "One"],
          [2, "Two"]
        ],
        "Not one or two",
        (x,y) => parseInt(x) === parseInt(y)
      );

  */
  export function match<I,O>(x: I,
    choices: Array<[I, O]>,
    defaultChoice: O,
    testFn?: (x: I, y: I) => boolean
  ): O {
    testFn = testFn || ((x: I, y:I) => x === y);
    let found = _.find(choices, (c) => testFn(c[0], x));
    return found ? found[1] : defaultChoice;
  }

  /*
    Returns an object with a callback and a promise. If callback is not called
    by time t, promise will reject.
  */
  export function timeoutP(t: number) {
    let dfd = $.Deferred<void>();
    setTimeout(function() {
      if (dfd.state() === "pending") { dfd.reject(); }
    }, t);

    return {
      promise: dfd.promise(),
      cb: function() {
        if (dfd.state() === "pending") { dfd.resolve(); }
      }
    };
  }
}
