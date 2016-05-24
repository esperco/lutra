/* jshint strict: false */
/*
  Include third party dependencies for React + utils + Bootstrap only
*/

// Helpers
var inject        = require("../../build-helpers/depends").inject;

var classNames    = require("classnames"),
    EventEmitter  = require("eventemitter3"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone"),
    page          = require("page"),
    polyfill      = require("./polyfill"),
    React         = require("react"),
    ReactDOM      = require("react-dom");

// CryptoJS -> only need SHA-1
var SHA1          = require("crypto-js/sha1.js");

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  require("bootstrap/js/modal");
  require("bootstrap/js/tooltip");
  require("bootstrap/js/transition");
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
    classNames:   classNames,
    jQuery:       jQuery,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    moment:       moment,
    momentTz:     momentTz,
    pageJs:       page,
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
