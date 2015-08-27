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
}