"use strict";
var cached = require("gulp-cached"),
    gulp = require("gulp");

/*
  Copies static assets from A to B, but with caching.

  src: string|string[] - source glob(s) (e.g "src/img/*.*")
  dest: string - pub dir (e.g. "pub/img")
*/
module.exports = function(src, dest) {
  return gulp.src(src)
    .pipe(cached(src, {
      // For static assets like images, cache MD5 rather than entire file
      optimizeMemory: true
    }))
    .pipe(gulp.dest(dest))
};

