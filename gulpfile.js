"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    mkdirp = require("mkdirp"),
    path = require("path"),
    spawnTsc = require("./gulp-helpers/spawn-tsc");

// TypeScript ///////////////////////////////

gulp.task("build-ts", function(cb) {
  mkdirp(path.join(config.pubDir, config.tscOutDir), function(err) {
    if (err) {
      console.error(err);
    } else {
      spawnTsc({}, cb);
    }
  });
});

gulp.task("watch-ts", gulp.series("build-ts", function(cb) {
  return spawnTsc({watch: true}, cb);
}));

// General //////////////////////

gulp.task("build", gulp.parallel("build-ts"));

gulp.task("watch", gulp.parallel("watch-ts"));

gulp.task("default", gulp.series("build"));

