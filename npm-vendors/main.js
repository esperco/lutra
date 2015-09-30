/*
  This file is deprecated. Require packages with
  require("marten-npm-vendors/package") instead.
*/

// Make inject function available outside of this function
module.exports.inject = require("./depends").inject;

// Stick packages that we want to Browserify here. Using Bower is actually
// preferable since it allows us to pull in other vendor assets besides JS
// and makes freezing things simpler, but sometimes there isn't a good
// Bower package that also plays well with Browserify.
//
// TODO: Look into finding a way to easily freeze NPM dependencies without
// having to freeze the entire node_modules directory.
//
module.exports.page = require("page");