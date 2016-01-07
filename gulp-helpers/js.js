"use strict";
var cached = require("gulp-cached"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    uglify = require("gulp-uglify");

/*
  Copies miscellaneous one-off JS files. Doesn't do any concatenation
  or anything like that -- use browserify module instead.

  src: string|string[] - source glob(s) (e.g "src/img/*.*")
  dest: string - pub dir (e.g. "pub/img")
  opts.production: boolean - Production mode?
*/
module.exports = function(src, dest, opts) {
  opts = opts || {};

  var ret = gulp.src(src)
    .pipe(cached(src, {
      // For static assets like images, cache MD5 rather than entire file
      optimizeMemory: true
    }));

  // Minimization
  if (opts.production) {
    ret = ret.pipe(uglify({
      output: {
        // Messing with unicode isn't fun
        "ascii_only": true
      }
    })).on("error", gutil.log)
  }

  return ret.pipe(gulp.dest(dest))
};

