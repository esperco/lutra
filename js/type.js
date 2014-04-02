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

  var undef;

  function error(s) {
    throw new TypeError(s);
  }

  function isString(x) {
    return typeof x === "string";
  }

  /* Check the _type field of a Javascript object */
  mod.check = function(t, x) {
    if (! isString(t))
      throw new TypeError("Invalid 1st argument passed to typecheck.check.");
    else if (x === null)
      throw new TypeError("null was found where type " + t + " was expected.");
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
  }

  /* Set the _type field of a Javascript object */
  mod.set = function(t, x) {
    x[typeNameField] = t;
    return x;
  }

  return mod;
})();
