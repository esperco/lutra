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
helpers.vendor.watch("watch-vendor", config);

// HTML files
helpers.html.build("build-html", config);
helpers.html.watch("watch-html", config);

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

gulp.task("build", gulp.series("clean",
  gulp.parallel("build-html", "build-test-reqs",
                "build-vendor", "build-ts", "build-less")));

gulp.task("build-production", gulp.series("production", "build"));

gulp.task("watch", gulp.series("build",
  gulp.parallel("watch-html", "watch-ts", "watch-less", "watch-vendor",
                "http-server", "live-reload")));

gulp.task("default", gulp.series("build"));
