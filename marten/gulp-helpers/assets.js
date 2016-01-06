"use strict";

// Use to create a browserify bundle of non-global vendor files for Gulp v4
module.exports = function(gulp) {
  var _ = require("lodash"),
      path = require("path");

  var exports = {};

  /*  Copy assets without change (e.g. fonts + images)
   *
   *  Expect config.assets to be of form:
   *  {
   *    "path/to/img/*.*": "pubDir/img",
   *    "path/to/fonts/*.*": "pubDir/fonts"
   *  }
   *
   */
  var buildName; // Set so watch can find
  exports.build = function(name, config) {
    buildName = name || "build-assets";

    // Reverse so destinations are used as keys to array of globs
    var destinations = {};
    _.each(config.assets, function(dest, srcGlob) {
      destinations[dest] = destinations[dest] || [];
      destinations[dest].push(srcGlob);
    });

    // Create a separate Gulp task for each destination with a postfix
    var taskNames = [];
    _.each(destinations, function(srcGlobList, dest) {
      var taskName = buildName + "-" + dest;
      taskNames.push(taskName);
      return gulp.task(taskName, function() {
        return gulp.src(srcGlobList)
          .pipe(gulp.dest(path.join(config.pubDir, dest)));
      });
    });

    // Gulp task that calls all glob matchers in parallel
    return gulp.task(buildName, gulp.parallel(taskNames));
  };

  exports.watch = function(name, config) {
    name = name || "watch-assets";
    gulp.task(name, function() {
      return gulp.watch(_.keys(config.assets), gulp.series(buildName));
    });
  };

  return exports;
};