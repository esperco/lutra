"use strict";
/* Use to create LESS-related tasks for Gulp v4 */

module.exports = function(gulp) {
  var autoprefixer = require("gulp-autoprefixer"),
      filter = require("gulp-filter"),
      less = require("gulp-less"),
      path = require("path"),
      sourcemaps = require("gulp-sourcemaps");

  var exports = {};

  /* Build LESS files that don't start with a "_" (partials) */
  var buildName; // Set so watch-less can find
  exports.build = function(name, config) {
    buildName = name || "build-less";
    return gulp.task(buildName, function() {
      var partialFilter = filter(['*', '!_*.less']);
      return gulp.src(config.lessDir + "/**/*.less")
        .pipe(partialFilter)
        .pipe(sourcemaps.init())
        .pipe(less({
          paths: [ path.resolve(config.lessDir) ]
        }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(path.join(config.pubDir, config.lessOutDir)));
      });
  };

  // Watch LESS directory for changes
  exports.watch = function(name, config) {
    name = name || "watch-less";
    return gulp.task(name, function() {
      return gulp.watch(config.lessDir + "/**/*.less", gulp.series(buildName));
    });
  };

  return exports;
};


