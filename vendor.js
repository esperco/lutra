/* jshint strict: false */

// Helpers
var inject        = require("marten-npm-vendors/depends").inject;

// Bower packages
var EventEmitter  = require("eventemitter3"),
    lodash        = require("lodash"),
    filepicker    = require("filepicker-js-bower"),
    jQuery        = require("jquery"),
    moment        = require("moment"),
    momentTz      = require("moment-timezone"),
    Raven         = require("raven-js");

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
  require("bootstrap");
});

// Create a global Esper object with our vendor dependencies
// NB: Since we don't have to worry about namespacing in Otter, we're just
// going to make Esper and window synonymous here.

// Create a global Esper object with our vendor dependencies
/* global Esper: true */
/* global window: false */
Esper = (function(esperObj) {
  var assignments = {
    _:            lodash,
    $:            jQuery,
    jQuery:       jQuery,
    // NB: This only works because we own the dir.esper.com domain
    //     It's highly likely that we would run into conflicts with other
    //     extensions if we replicate this hack in stoat
    filepicker:   window.filepicker,
    CryptoJS:     { SHA1: SHA1 },
    EventEmitter: EventEmitter,
    moment:       moment,
    momentTz:     momentTz,
    pageJs:       page,
    Raven:        Raven,
    React:        react
  };
  for (var name in assignments) {
    if (assignments.hasOwnProperty(name)) {
      esperObj[name] = assignments[name];
    }
  }
  return esperObj;
})(window || {});


// Config Raven here rather than in TS so we can catch init errors
Raven.config(
  'https://bfc503961d394fea8f0a0df8dd98aeea@app.getsentry.com/61081'
).install();


///////

// Segment's Analytics.js
(function(){

  // Create a queue, but don't obliterate an existing one!
  var analytics = window.analytics = window.analytics || [];

  // If the real analytics.js is already on the page return.
  if (analytics.initialize) return;

  // If the snippet was invoked already show an error.
  if (analytics.invoked) {
    if (window.console && console.error) {
      console.error('Segment snippet included twice.');
    }
    return;
  }

  // Invoked flag, to make sure the snippet
  // is never invoked twice.
  analytics.invoked = true;

  // A list of the methods in Analytics.js to stub.
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'page',
    'once',
    'off',
    'on'
  ];

  // Define a factory to create stubs. These are placeholders
  // for methods in Analytics.js so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  analytics.factory = function(method){
    return function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };
  };

  // For each of our methods, generate a queueing stub.
  for (var i = 0; i < analytics.methods.length; i++) {
    var key = analytics.methods[i];
    analytics[key] = analytics.factory(key);
  }

  // Define a method to load Analytics.js from our CDN,
  // and that will be sure to only ever load it once.
  analytics.load = function(key){
    // Create an async script element based on your key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = ('https:' === document.location.protocol
      ? 'https://' : 'http://')
      + 'cdn.segment.com/analytics.js/v1/'
      + key + '/analytics.min.js';

    // Insert our script next to the first script element.
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
  };

  // Add a version to keep track of what's in the wild.
  analytics.SNIPPET_VERSION = '3.1.0';
})();