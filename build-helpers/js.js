"use strict";
var cached = require("gulp-cached"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    production = require("./production"),
    randomstring = require("randomstring"),
    rev = require("gulp-rev"),
    uglify = require("gulp-uglify");

/*
  Copies miscellaneous one-off JS files. Doesn't do any concatenation
  or anything like that -- use browserify module instead.

  src: string|string[] - source glob(s) (e.g "src/img/*.*")
  dest: string - pub dir (e.g. "pub/img")
*/
module.exports = function(src, dest) {
  var ret = gulp.src(src)
    .pipe(cached(src, {
      // For static assets like images, cache MD5 rather than entire file
      optimizeMemory: true
    }));

  // Minimization
  if (production.isSet()) {
    ret = ret.pipe(uglify({
      output: {
        // Messing with unicode isn't fun
        "ascii_only": true
      }
    })).on("error", gutil.log);

    // For prod, MD5 hash final file and write to manifest
    ret = ret
      .pipe(rev())
      .pipe(gulp.dest(dest))
      .pipe(rev.manifest(
        "js-" + randomstring.generate(7) + ".manifest.json"
      ))
  }

  return ret.pipe(gulp.dest(dest))
};

