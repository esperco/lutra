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

  assetMap: {
    "img/**/*.*": "pub/img",
    "img/favicon.ico": "pub",
    "../node_modules/bootstrap/fonts/*.*": "pub/fonts",
    "../node_modules/font-awesome/fonts/*.*": "pub/fonts"
  },

  jsGlobs: ["js/**/*.js"],
  jsBundles: [
    "bundles/react-simple-vendor.js",
    "bundles/test-vendor.js",
    "bundles/timestats-vendor.js"
  ],
  jsOut: "pub/js",

  jasmineDir: "pub/jasmine",

  tsGlobs: [
    "ts/**/*.{ts,tsx}"
  ],
  tsProjects: [
    "ts/test.js/tsconfig.json",
    "ts/login.js/tsconfig.json"
  ],

  lessGlobs: [
    "less/**/*.{css,less}",
    "../node_modules/font-awesome/css/font-awesome.css"
  ],
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

gulp.task("build-jasmine", function() {
  return helpers.jasmine(config.jasmineDir);
});

gulp.task("build-js", function() {
  return helpers.js(config.jsGlobs, config.jsOut);
});

gulp.task("watch-js", watch(config.jsGlobs, "build-js"));

gulp.task("build-ts", function() {
  return helpers.typescript(config.tsGlobs,
                            config.tsProjects,
                            config.jsOut);
});

gulp.task("watch-ts", watch(config.tsGlobs, "build-ts"));

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

gulp.task("server", function(cb) {
  return helpers.server(config.pubDir, cb, {
    port: config.serverPort,
    liveReloadPort: config.liveReloadPort
  });
});

gulp.task("build", gulp.parallel("build-html",
                                 "build-assets",
                                 "build-jasmine",
                                 "build-js",
                                 "build-bundles",
                                 "build-ts",
                                 "build-less"));

gulp.task("clean", function(cb) {
  helpers.clean(config.pubDir, cb);
});

gulp.task("production", helpers.setProduction);

gulp.task("build-production", gulp.series("production", "clean", "build"))

gulp.task("watch", gulp.series("clean", "build",
  gulp.parallel(
    "server",
    "watch-html",
    "watch-assets",
    "watch-js",
    "watch-bundles",
    "watch-ts",
    "watch-less"
  )
));

gulp.task("default", gulp.series("build"));
