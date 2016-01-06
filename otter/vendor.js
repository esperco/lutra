/* jshint strict: false */

// Helpers
var inject        = require("marten-npm-vendors/depends").inject;

// Bower packages
var EventEmitter  = require("eventemitter3"),
    fullCalendar  = require("fullcalendar"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone"),
    quill         = require("quill");

// React -> get addons
var react         = require("./marten/vendor/react/react-with-addons.js");

// CryptoJS -> only need SHA-1
var SHA1          = require("./marten/vendor/crypto-js/sha1.js");

// NB: NPM, not Bower package. Bower package doesn't work well with
// Browserify unless we want to rewrite its import code.
//
// TODO: Look into finding a way to easily freeze NPM dependencies without
// having to freeze the entire node_modules directory.
//
var page = require("marten-npm-vendors/page");

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  // NB: Bootstrap only -- if jQuery-UI required, require path to jquery-ui
  // component as needed
  require("bootstrap");
});

// Create a global Esper object with our vendor dependencies
// NB: Since we don't have to worry about namespacing in Otter, we're just
// going to make Esper and window synonymous here.

/* global Esper: true */
/* global window: false */
Esper = (function(esperObj) {
  var assignments = {
    _:            lodash,
    $:            jQuery,
    jQuery:       jQuery,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    fullCalendar: fullCalendar,
    moment:       moment,
    momentTz:     momentTz,
    pageJs:       page,
    React:        react,
    quill:        quill
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window || {});
