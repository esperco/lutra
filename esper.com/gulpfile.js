"use strict";

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var _ = require("lodash"),
    gulp = require("gulp"),
    helpers = require("../build-helpers/gulp"),
    watch = helpers.watch(gulp);

/* Config vars */
var config = {
  htmlGlobs: ["html/**/*.html"],
  htmlOut: "pub", // HTML goes to root rather than subdir

  imgGlobs: ["img/**/*.*"],
  imgOut: "pub/img",

  jsGlobs: ["js/**/*.js"],
  jsBundles: [
    "bundles/react-simple-vendor.js",
    "bundles/timestats-vendor.js"
  ],
  jsOut: "pub/js",

  lessGlobs: ["css/**/*.less", "css/**/*.css"],
  lessOut: "pub/css",

  pubDir: "pub",

  serverPort: 5000,
  liveReloadPort: 35729
};

/* Gulp tasks */

gulp.task("build-less", function() {
  return helpers.less(config.lessGlobs, config.lessOut);
});

gulp.task("watch-less", watch(config.lessGlobs, "build-less"));

gulp.task("build-js", function() {
  return helpers.js(config.jsGlobs, config.jsOut);
});

gulp.task("watch-js", watch(config.jsGlobs, "build-js"));

gulp.task("build-img", function() {
  return helpers.assets(config.imgGlobs, config.imgOut);
});

gulp.task("watch-img", watch(config.imgGlobs, "build-img"));

gulp.task("build-html", function() {
  return helpers.html(config.htmlGlobs, config.htmlOut);
});

gulp.task("watch-html", watch(config.htmlGlobs, "build-html"));

gulp.task("build-bundles", function() {
  return helpers.bundle(config.jsBundles, config.jsOut);
});

// NB: Watching Browserify bundles just means passing an extra boolean to
// build step. Gulp's watcher is not required.
gulp.task("watch-bundles", function() {
  return helpers.bundle(config.jsBundles, config.jsOut, true);
});

gulp.task("server", function(cb) {
  return helpers.server(config.pubDir, cb, {
    port: config.serverPort,
    liveReloadPort: config.liveReloadPort
  });
});

gulp.task("build", gulp.parallel("build-html",
                                 "build-js",
                                 "build-bundles",
                                 "build-less",
                                 "build-img"));

gulp.task("clean", function(cb) {
  helpers.clean(config.pubDir, cb);
});

gulp.task("production", helpers.setProduction);

gulp.task("build-production", gulp.series("production", "clean", "build"))

gulp.task("watch", gulp.series("clean", "build",
  gulp.parallel(
    "server",
    "watch-html",
    "watch-img",
    "watch-js",
    "watch-bundles",
    "watch-less"
  )
));

gulp.task("default", gulp.series("build"));
