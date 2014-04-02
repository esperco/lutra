/*
  Monkey typing

  'cause monkeys are better than ducks.


  var d = new Date();
  type.set("date", d);
  type.check("localdate", d); // throws standard TypeError exception

*/

var type = (function() {
  var mod = {};

  var typeNameField = "_type";

  /* Protect against redefinition of undefined */
  var undef;

  function error(s) {
    throw new TypeError(s);
  }

  function isString(x) {
    return typeof x === "string";
  }

  /* Protect against later redefinition of Object */
  var Obj = Object;

  function isObject(x) {
    return x instanceof Obj;
  }

  /* Check the _type field of a Javascript object */
  mod.check = function(t, x) {
    if (! isString(t))
      error("Invalid 1st argument passed to typecheck.check.");
    else if (x === null)
      error("null was found where type " + t + " was expected.");
    else if (x === undef)
      error("undefined was found where type " + t + " was expected.");
    else {
      var found = x[typeNameField];
      if (found === undef)
        error("Missing type information. Expected type was " + t + ".");
      else if (! isString(found))
        error("Malformed type information. Expected type was " + t + ".");
      else if (found !== t)
        error("Found object of type " + found
              + " where type " + t + " was expected.");
    }
    return x;
  };

  /*
    Check the _type field of a Javascript object
    but accept null and undefined.
  */
  mod.opt = function(t, x) {
    if (x === null || x === undef)
      return x;
    else
      return mod.check(t, x)
  };

  /*
    Set the _type field of a Javascript object,
    ignoring existing type field if any.
  */
  mod.cast = function(t, x) {
    if (! isString(t))
      error("Attempt to assign a type name that is not a string.");

    if (! isObject(x))
      error("Attempt to assign type name "
            + JSON.stringify(t)
            + " to a non-object.");

    x[typeNameField] = t;
    return x;
  };

  /*
    Set the _type field of a Javascript object,
    failing if already set (even to the same type)
  */
  mod.set = function(t, x) {
    var t0 = x[typeNameField];
    if (t0 !== undef) {
      var s = "<not a string>";
      if (isString(t0))
        s = JSON.stringify(t0);
      error("Attempt to assign type " + t
            + " to object which already has a " + typeNameField
            + " field (" + s + ").");
    }
    else
      return mod.cast(t, x);
  };

  return mod;
})();
