"use strict";
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


// General //////////////////////

helpers.clean.clean("clean", config);

gulp.task("production", function(cb) {
  config.production = true;
  cb();
});

// Quick build, no vendor
var buildBase = gulp.parallel("build-ts", "build-less");

gulp.task("build", gulp.parallel("build-vendor-once", buildBase));

gulp.task("rebuild", gulp.parallel("build-vendor", buildBase));

gulp.task("build-production", gulp.series("production", "rebuild"));

gulp.task("watch", gulp.series("build",
  gulp.parallel("watch-ts", "watch-less", "watch-vendor")));

gulp.task("default", gulp.series("build"));
