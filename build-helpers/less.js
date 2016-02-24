"use strict";
var _ = require("lodash"),
    autoprefixer = require("gulp-autoprefixer"),
    deglob = require("./deglob"),
    filter = require("gulp-filter"),
    gulp = require("gulp"),
    less = require("gulp-less"),
    minifyCss = require("gulp-cssnano"),
    path = require("path"),
    production = require("./production"),
    sourcemaps = require("gulp-sourcemaps");

/*
  Returns LESS pipeline, does not compile files that start with "_" (partials),
  but does consider them if imported from other LESS files.

  globs: string[] - Globs to LESS files
  out: string - Directory to output compiled CSS
*/
module.exports = function(globs, out) {
  var partialFilter = filter(['*', '!_*.less']);
  var baseDirs = deglob(globs);

  var ret = gulp.src(globs)
    .pipe(partialFilter)
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: _.map(baseDirs, function(d) { path.resolve(d); })
    }))
    .pipe(autoprefixer());

  if (production.isSet()) {
    // External source maps + minimize
    ret = ret.pipe(minifyCss({ zindex: false }))
             .pipe(sourcemaps.write("./"));
  } else {
    // Inline source maps
    ret = ret.pipe(sourcemaps.write());
  }

  return ret.pipe(gulp.dest(out));
};
