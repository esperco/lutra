"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    helpers = require("marten-gulp-helpers")(gulp);

// TypeScript
helpers.tsc.build("build-ts", config);
helpers.tsc.watch("watch-ts", config);

// LESS
helpers.less.build("build-less", config);
helpers.less.watch("watch-less", config);

// Vendor JS
helpers.vendor.build("build-vendor", config);
helpers.vendor.watch("watch-vendor", config);

// Assets
gulp.task("build-html", function() {
  return gulp.src(config.htmlDir + "/**/*.html")
    .pipe(gulp.dest(config.pubDir));
});

gulp.task("watch-html", gulp.series("build-html", function() {
  return gulp.watch(config.htmlDir + "/**/*.html", gulp.series("build-html"));
}));

// Live-reload servers
helpers.server.httpServer("http-server", config);
helpers.server.liveReload("live-reload", config);

// General //////////////////////

helpers.clean.clean("clean", config);

gulp.task("build", gulp.series("clean",
  gulp.parallel("build-html", "build-vendor", "build-ts", "build-less")));

gulp.task("watch", gulp.series("build",
  gulp.parallel("watch-html", "watch-ts", "watch-less", "watch-vendor",
                "http-server", "live-reload")));

gulp.task("default", gulp.series("build"));
