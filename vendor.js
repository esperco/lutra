/* jshint strict: false */

// Helpers
var vendors       = require("marten-npm-vendors");
var inject        = vendors.inject;

// Bower packages
var EventEmitter  = require("eventemitter3"),
    fullCalendar  = require("fullcalendar"),
    gmailJs       = require("gmail.js"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone");

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
var page = vendors.page;

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  require("jquery-ui");
  // require("bootstrap"); // TODO: Fix incompatabilities between our old code
                           // and official Bootstrap code
});

// Create a global Esper object with our vendor dependencies
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
    gmailJs:      gmailJs,
    moment:       moment,
    momentTz:     momentTz,
    page:         page,
    React:        react
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window.Esper || {});

if (Esper._.isFunction(Esper.onVendorReady)) {
  Esper.onVendorReady();
}
Esper.vendorReady = true;
