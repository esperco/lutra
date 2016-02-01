"use strict";

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var _ = require("lodash"),
    gulp = require("gulp"),
    helpers = require("../build-helpers/gulp"),
    watch = helpers.watch(gulp);

/* Config vars */
var config = {
  htmlGlobs: ["options-page/html/**/*.html"],
  htmlOut: "pub/html", // HTML goes to root rather than subdir

  assetMap: {
    "img/**/*.*": "pub/img",
    "../node_modules/bootstrap/fonts/*.*": "pub/fonts",
    "../node_modules/font-awesome/fonts/*.*": "pub/fonts"
  },

  jsBundles: ["vendor.js"],
  jsOut: "pub/js",

  tsCommonGlobs: [
    "common/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}"
  ],
  tsProjects: [
    "content-script/tsconfig.json",
    "event-page/tsconfig.json",
    "gcal-is/tsconfig.json",
    "gmail-is/tsconfig.json",
    "options-page/tsconfig.json"
  ],

  lessGlobs: [
    "css/**/*.{css,less}"
  ],
  lessOut: "pub/css",

  pubDir: "pub"
};

/* Gulp tasks */

gulp.task("build-less", function() {
  return helpers.less(config.lessGlobs, config.lessOut);
});

gulp.task("watch-less", watch(config.lessGlobs, "build-less"));

var ts = helpers.typescript(config.tsProjects,
                            config.tsCommonGlobs,
                            config.jsOut);
gulp.task("build-ts", ts.build);
gulp.task("watch-ts", ts.watch);

gulp.task("build-assets", function() {
  return helpers.assets(config.assetMap);
});

gulp.task("watch-assets", watch(_.keys(config.assetMap), "build-assets"));

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

gulp.task("build", gulp.parallel("build-html",
                                 "build-assets",
                                 "build-bundles",
                                 "build-ts",
                                 "build-less"));

gulp.task("clean", function(cb) {
  helpers.clean(config.pubDir, cb);
});

gulp.task("production", helpers.setProduction);

gulp.task("build-production", gulp.series("production", "clean", "build"))

gulp.task("watch", gulp.series("build",
  gulp.parallel(
    "watch-html",
    "watch-assets",
    // "watch-bundles", // Skipping since bundling is expensive
                        // If you need to re-bundle, clean and restart.
    "watch-ts",
    "watch-less"
  )
));

gulp.task("default", gulp.series("build"));
