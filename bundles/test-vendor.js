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
    momentTz      = require("moment-timezone"),
    polyfill      = require("./polyfill"),
    React         = require("react"),
    ReactDOM      = require("react-dom");

// CryptoJS -> only need SHA-1
var SHA1          = require("crypto-js/sha1.js");

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  require("bootstrap");
});

// Create a global Esper object with our vendor dependencies -- don't polute
// global scope

/* global Esper: true */
Esper = (function(esperObj) {
  var assignments = {
    _:            lodash.noConflict(),
    $:            jQuery,
    jQuery:       jQuery,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    moment:       moment,
    momentTz:     momentTz,
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
})(window.Esper || {});
