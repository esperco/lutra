/* jshint strict: false */
/*
  Include third party dependencies for landing page
*/

// Helpers
var inject        = require("../../build-helpers/depends").inject;

var lodash        = require("lodash"),
    jQuery        = require("jquery"),
    polyfill      = require("./polyfill");

// Create a global Esper object with our vendor dependencies
// NB: Since we don't have to worry about namespacing on our own site, we're
// just going to make Esper and window synonymous here.

// Create a global Esper object with our vendor dependencies
/* global Esper: true */
/* global window: false */
Esper = (function(esperObj) {
  var assignments = {
    _:            lodash.noConflict(),
    $:            jQuery,
    jQuery:       jQuery,
    PRODUCTION:   (process.env.NODE_ENV === "production")
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window || {});
