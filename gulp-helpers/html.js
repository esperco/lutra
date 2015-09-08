"use strict";
/* Use to create LESS-related tasks for Gulp v4 */

module.exports = function(gulp) {
  var _ = require("lodash"),
      minify = require("gulp-minify-html"),
      path = require("path"),
      preprocess = require("gulp-preprocess");

  var exports = {};

  /* Minify HTML files and run pre-processor with config */
  var buildName; // Set so watch-html can find
  exports.build = function(name, config) {
    buildName = name || "build-html";
    return gulp.task(buildName, function() {
      var htmlDirs = config.htmlDirs || [config.htmlDir];
      htmlDirs = _.map(htmlDirs, function(dir) {
        return path.join(dir, "**/*.html");
      });
      var ret = gulp.src(htmlDirs)
        .pipe(preprocess({context: config}));
      if (config.production) {
        ret = ret.pipe(minify());
      }
      return ret.pipe(gulp.dest(config.pubDir));
    });
  };

  // Watch HTML directory for changes
  exports.watch = function(name, config) {
    name = name || "watch-html";
    return gulp.task(name, function() {
      return gulp.watch(config.htmlDir + "/**/*.html", gulp.series(buildName));
    });
  };

  return exports;
};


