"use strict";

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var _ = require("lodash"),
    gulp = require("gulp"),
    helpers = require("../gulp-helpers"),
    watch = helpers.watch(gulp);

/* Config vars */
var config = {
  htmlGlobs: ["html/**/*.html"],
  htmlOut: "pub", // HTML goes to root rather than subdir

  imgGlobs: ["img/**/*.*"],
  imgOut: "pub/img",

  jsGlobs: ["js/**/*.js"],
  jsOut: "pub/js",

  lessGlobs: ["css/**/*.less", "css/**/*.css"],
  lessOut: "pub/css",

  pubDir: "pub",

  serverPort: 5000,
  liveReloadPort: 35729
};

// This var gets set to true by production task
var production = false;


/* Gulp tasks */

gulp.task("build-less", function() {
  return helpers.less(config.lessGlobs, config.lessOut, {
    production: production
  });
});

gulp.task("watch-less", watch(config.lessGlobs, "build-less"));

gulp.task("build-js", function() {
  return helpers.js(config.jsGlobs, config.jsOut, {
    production: production
  });
});

gulp.task("watch-js", watch(config.jsGlobs, "build-js"));

gulp.task("build-img", function() {
  return helpers.assets(config.imgGlobs, config.imgOut);
});

gulp.task("watch-img", watch(config.imgGlobs, "build-img"));

gulp.task("build-html", function() {
  return helpers.html(config.htmlGlobs, config.htmlOut, {
    production: production,
    data: {
      PRODUCTION: !!production
    }
  });
});

gulp.task("watch-html", watch(config.htmlGlobs, "build-html"));

gulp.task("server", function(cb) {
  return helpers.server(config.pubDir, cb, {
    port: config.serverPort,
    liveReloadPort: config.liveReloadPort
  });
});

gulp.task("build", gulp.parallel("build-html",
                                 "build-js",
                                 "build-less",
                                 "build-img"));

gulp.task("clean", function(cb) {
  helpers.clean(config.pubDir, cb);
});

gulp.task("production", function(cb) {
  production = true;
  cb();
});

gulp.task("build-production", gulp.series("production", "clean", "build"))

gulp.task("watch", gulp.series("clean", "build",
  gulp.parallel(
    "server",
    "watch-html",
    "watch-img",
    "watch-js",
    "watch-less"
  )
));

gulp.task("default", gulp.series("build"));
