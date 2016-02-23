/* jshint strict: false */
/*
  Include third party dependencies for React + utils + Bootstrap only
*/

// Helpers
var inject        = require("../../build-helpers/depends").inject;

var EventEmitter  = require("eventemitter3"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    polyfill      = require("./polyfill"),
    React         = require("react"),
    ReactDOM      = require("react-dom");

// CryptoJS -> only need SHA-1
var SHA1          = require("crypto-js/sha1.js");

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  // require("bootstrap");
});

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
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    moment:       moment,
    PRODUCTION:   (process.env.NODE_ENV === "production"),
    React:        React,
    ReactDOM:     ReactDOM
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window || {});
