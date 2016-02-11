/* jshint strict: false */

// Helpers
var inject        = require("../../build-helpers/depends").inject;

var EventEmitter  = require("eventemitter3"),
    fullCalendar  = require("fullcalendar"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone"),
    page          = require("page"),
    polyfill      = require("./polyfill"),
    quill         = require("quill");

// CryptoJS -> only need SHA-1
var SHA1          = require("crypto-js/sha1.js");

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
    _:            lodash.noConflict(),
    $:            jQuery,
    jQuery:       jQuery,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    fullCalendar: fullCalendar,
    moment:       moment,
    momentTz:     momentTz,
    pageJs:       page,
    PRODUCTION:   (process.env.NODE_ENV === "production"),
    quill:        quill
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window || {});
