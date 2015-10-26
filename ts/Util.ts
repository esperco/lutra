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
          (<any> o)[prop] !== null &&
          typeof (<any> o)[prop] === "object") {
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
  export function hexDecode(hex) {
    var s = "";
    for (var i = 0; i < hex.length; i += 2)
      s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return s;
  }
}