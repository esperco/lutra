"use strict";
var _ = require("lodash"),
    gulp = require("gulp"),
    path = require("path");

// Absolute path of vendor (NPM or Bower)
var VENDOR_DIR = path.resolve(__dirname, "../node_modules");

/*
  Use to copy test framework files for Gulp v4

  outDir: string - Where to copy to
*/
module.exports = function(outDir) {
  var relPath = path.relative(process.cwd(), VENDOR_DIR);
  var jasmineRoot = path.join(relPath, "jasmine-core/lib/jasmine-core");
  var jasmineFiles = _.map([
    "jasmine.js",
    "jasmine.css",
    "jasmine-html.js",
    "boot.js"
  ], function(fn) {
    return path.join(jasmineRoot, fn);
  });

  return gulp.src(jasmineFiles)
    .pipe(gulp.dest(outDir));
};
