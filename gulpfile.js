"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    helpers = require("marten-gulp-helpers")(gulp);

// TypeScript
helpers.typescript.build("build-ts", config);
helpers.typescript.watch("watch-ts", config);

// LESS
helpers.less.build("build-less", config);
helpers.less.watch("watch-less", config);

// Vendor JS
helpers.vendor.build("build-vendor", config);
helpers.vendor.buildOnce("build-vendor-once", config);
helpers.vendor.watch("watch-vendor", config);

// HTML files
helpers.html.build("build-html", config);
helpers.html.watch("watch-html", config);

// Images and other static assets
helpers.assets.build("build-assets", config);
helpers.assets.watch("watch-assets", config);

// Test helpers
helpers.test.build("build-test-reqs", config);

// Live-reload servers
helpers.server.httpServer("http-server", config);
helpers.server.liveReload("live-reload", config);

// General //////////////////////

helpers.clean.clean("clean", config);

gulp.task("production", function(cb) {
  config.production = true;
  cb();
});

// Quick build, no vendor
var buildProdBase = gulp.parallel(
  "build-html", "build-ts", "build-less", "build-assets");

var buildDevBase = gulp.parallel(buildProdBase, "build-test-reqs");

gulp.task("rebuild", gulp.parallel("build-vendor", buildDevBase));

gulp.task("build", gulp.parallel("build-vendor-once", buildDevBase));

gulp.task("build-production", gulp.series("production", gulp.parallel(
  "build-vendor", buildProdBase
)));

gulp.task("watch", gulp.series(
  function(cb) { config.watchMode = true; cb(); }, "build",
  gulp.parallel("watch-html", "watch-ts", "watch-less", "watch-assets",
                "watch-vendor", "http-server", "live-reload")));

gulp.task("default", gulp.series("build"));
