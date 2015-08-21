/* jshint strict: false */

// Helper
var depends       = require("./depends");

// Bower packages
var fullCalendar  = require("fullcalendar"),
    lodash        = require("lodash"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone");

// CryptoJS -> only need SHA-1
var SHA1          = require("./crypto-js/sha1.js");

// NB: NPM, not Bower package. Bower package doesn't work well with
// Browserify unless we want to rewrite its import code.
//
// TODO: Look into finding a way to easily freeze NPM dependencies without
// having to freeze the entire node_modules directory.
//
var page = require("page");

// Dependencies that add to jQuery global
depends.inject({jQuery: jQuery, $: jQuery}, function() {
  require("jquery-ui");
  require("bootstrap");
});

// Create a global Vesper object with our vendor dependencies
/* global Vesper: true */
Vesper = {
  _:            lodash,
  $:            jQuery,
  jQuery:       jQuery,
  CryptoJS:     { SHA1: SHA1 },
  fullCalendar: fullCalendar,
  moment:       moment,
  momentTz:     momentTz,
  page:         page
};
