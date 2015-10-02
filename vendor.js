/* jshint strict: false */

// Helpers
var inject        = require("marten-npm-vendors/depends").inject;

// Bower packages
var EventEmitter  = require("eventemitter3"),
    fullCalendar  = require("fullcalendar"),
    gmailJs       = require("gmail.js"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone"),
    quill         = require("quill");

// React -> get addons
var react         = require("./marten/vendor/react/react-with-addons.js");

// CryptoJS -> only need SHA-1
var SHA1          = require("./marten/vendor/crypto-js/sha1.js");

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
    React:        react,
    quill:        quill
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window.Esper || {});

/*
  Analytics.js is weird and is tricky to import in a namespace safe manner
  because of how its build script works. It also seems to rely on import via
  CDN to set the write key. That's not a viable option for Chrome extensions
  because of how Chrome's security model works, so we're assuming that
  analytics.js has already been loaded via another method (e.g. the
  manifest.json) and we're going to add a load function we can call with the
  proper writeKey.
*/
(function(analytics) {
  if (! analytics.load) { // Don't override an existing analytics.load
                          // function (e.g. in case vendor file loaded via an
                          // injected script and Gmail already defines this)
    analytics.load = function(writeKey) {
      this.initialize({
        "Segment.io": {"apiKey": writeKey}
      }, {});
    };
  }
})(window.analytics || {});

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
