/* jshint strict: false */
/*
  Include third party dependencies for timestats
*/

// Helpers
var inject        = require("../../build-helpers/depends").inject;

var autosize      = require("autosize"),
    classNames    = require("classnames"),
    EventEmitter  = require("eventemitter3"),
    fullCalendar  = require("fullcalendar"),
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

var highcharts;

// Dependencies that add to jQuery global
inject({jQuery: jQuery, $: jQuery}, function() {
  require("bootstrap/js/modal");
  require("bootstrap/js/tooltip");
  require("bootstrap/js/transition");

  highcharts = require("highcharts");
  require("highcharts/modules/exporting")(highcharts);
  require("highcharts/modules/offline-exporting")(highcharts);
});

// Create a global Esper object with our vendor dependencies
// NB: Since we don't have to worry about namespacing on our own site, we're
// just going to make Esper and window synonymous here.

// Create a global Esper object with our vendor dependencies
/* global Esper: true */
/* global window: false */
window.Esper = Esper = (function(esperObj) {
  var assignments = {
    _:            lodash.noConflict(),
    $:            jQuery,
    autosize:     autosize,
    classNames:   classNames,
    jQuery:       jQuery,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    fullCalendar: fullCalendar,
    Highcharts:   highcharts,
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
