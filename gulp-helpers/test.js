"use strict";

/* Use to create test-related tasks for Gulp v4 */
module.exports = function(gulp) {
  var _ = require("lodash"),
      path = require("path"),
      vendor = require("./vendor")(gulp);

  var exports = {};

  /* Set up test runner requirements */
  exports.build = function(name, config) {
    name = "build-test-reqs" || name;
    var jasmineRoot = path.join(vendor.getVendorDir(),
      "jasmine/lib/jasmine-core");
    var jasmineFiles = _.map([
      "jasmine.js",
      "jasmine.css",
      "jasmine-html.js",
      "boot.js"
    ], function(fn) {
      return path.join(jasmineRoot, fn);
    });

    return gulp.task(name, function() {
      return gulp.src(jasmineFiles)
        .pipe(gulp.dest(path.join(config.pubDir, config.testDir)));
    });
  };

  return exports;
};


