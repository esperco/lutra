"use strict";
/* Use to create LESS-related tasks for Gulp v4 */

module.exports = function(gulp) {
  var _ = require("lodash"),
      autoprefixer = require("gulp-autoprefixer"),
      filter = require("gulp-filter"),
      less = require("gulp-less"),
      minifyCss = require("gulp-minify-css"),
      path = require("path"),
      sourcemaps = require("gulp-sourcemaps");

  var exports = {};

  // Returns LESS globs based on lessDir(s) props in the config object
  var getLessGlobs = function(config) {
    var lessDirs = config.lessDirs || [config.lessDir];
    return _.map(lessDirs, function(dir) {
      return path.join(dir, "**/*.less");
    });
  };

  /* Build LESS files that don't start with a "_" (partials) */
  var buildName; // Set so watch-less can find
  exports.build = function(name, config) {
    buildName = name || "build-less";
    return gulp.task(buildName, function() {
      var partialFilter = filter(['*', '!_*.less']);
      var lessDirs = config.lessDirs || [config.lessDir];
      var ret = gulp.src(getLessGlobs(config))
        .pipe(partialFilter)
        .pipe(sourcemaps.init())
        .pipe(less({
          paths: _.map(lessDirs, function(d) { path.resolve(d); })
        }))
        .pipe(autoprefixer());

      if (config.production) {
        // External source maps + minimize
        ret = ret.pipe(minifyCss())
                 .pipe(sourcemaps.write("./"));
      } else {
        // Inline source maps
        ret = ret.pipe(sourcemaps.write());
      }

      return ret.pipe(gulp.dest(path.join(config.pubDir, config.lessOutDir)));
    });
  };

  // Watch LESS directory for changes
  exports.watch = function(name, config) {
    name = name || "watch-less";
    return gulp.task(name, function() {
      return gulp.watch(getLessGlobs(config), gulp.series(buildName));
    });
  };

  return exports;
};


