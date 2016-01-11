"use strict";

var PRODUCTION = "production";

/* A simple function that sets production mode */
exports.set = function(cb) {
  process.env.NODE_ENV = PRODUCTION;
  if (typeof cb === "function" ) { cb(); }
};

exports.isSet = function() {
  return process.env.NODE_ENV === PRODUCTION;
};
