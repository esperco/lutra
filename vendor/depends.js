/* Module with helpers for our vendor index file -- this is NodeJS code, but
   we expect this to be Browserified */

/* Wraps a (synchronous) function and calls it with a given name on the global
   object defined with a given replacement object. Restores the original item
   when function is done.
   @param {object} replacementMap - Map of global names to objects we want
    to fill in for them
   @param {any} replacement - Replacement object
   @param {function} fn - Wrapped function
*/
exports.inject = function(replacementMap, fn) {
  "use strict";

  var globalObj;
  if (typeof global === "object") {
    /* globals global: false */ // Expect global to be shimmed by Browserify
    globalObj = global;
  } else {
    /* globals window: false */ // Expect window to be present for client
    globalObj = window;
  }

  // Record original objects and then replace
  var oldMap = {};
  var name;
  for (name in replacementMap) {
    if (replacementMap.hasOwnProperty(name)) {
      oldMap[name] = globalObj[name];         // Record originals
      globalObj[name] = replacementMap[name]; // Replace with new
    }
  }

  fn();

  // Restore originals
  for (name in oldMap) {
    if (oldMap.hasOwnProperty(name)) {
      globalObj[name] = oldMap[name];
    }
  }
};
