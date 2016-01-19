/// <reference path="../typings/lodash/lodash.d.ts" />

module Esper.Util {
  // Return a random alphanumeric string
  export function randomString() {
    return Math.random().toString(36).slice(2);
  };

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
    eq = eq || _.eq;
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
  export function getParamByName(name: string): string {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return (results === null ? "" :
      decodeURIComponent(results[1].replace(/\+/g, " ")));
  }

  // Normalize falsey values to null
  export function nullify<T>(a: T): T {
    return a ? a : null;
  }
}
