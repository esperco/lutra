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
    momentTz      = require("moment-timezone"),
    quill         = require("quill"),
    analytics     = require("analytics");

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

  // Bootstrap has some conflicts with jQuery-UI. Default to jQuery-UI's
  // version for now
  require("bootstrap");
  jQuery.fn.tooltip.noConflict();
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
    React:        react,
    quill:        quill,
    analytics:    analytics
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window.Esper || {});

// Load post-vendor script based on data attributes attached to the script
var vendorScript = Esper.$("#esper-vendor-script");
if (vendorScript.length) {
  var attrs = vendorScript.data("load-next");
  if (attrs) {
    if (typeof attrs === "string") {
      attrs = JSON.parse(attrs);
    }
    var nextScript = Esper.$('<script />');
    nextScript.attr(attrs).appendTo(Esper.$('head'));
  }
}
