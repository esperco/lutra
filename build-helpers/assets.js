"use strict";
var _ = require("lodash"),
    cached = require("gulp-cached"),
    gulp = require("gulp"),
    merge = require("merge-stream");

/*
  Copies static assets from A to B, but with caching.

  map: {[index: string]: string} - A map of globs to destination directories
    such as {"img/*.*": "pub/img", "fonts/*.*": "pub/fonts"}
*/
module.exports = function(map) {
  return merge.apply(null, _.map(map, function(dest, srcGlob) {
    return copyOne(srcGlob, dest);
  }));
};

function copyOne(src, dest) {
  return gulp.src(src)
    .pipe(cached(src, {
      // For static assets like images, cache MD5 rather than entire file
      optimizeMemory: true
    }))
    .pipe(gulp.dest(dest));
}
