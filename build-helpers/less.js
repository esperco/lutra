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
    randomstring = require("randomstring"),
    rev = require("gulp-rev"),
    sourcemaps = require("gulp-sourcemaps");

/*
  Returns LESS pipeline, does not compile files that start with "_" (partials),
  but does consider them if imported from other LESS files.

  globs: string[] - Globs to LESS files
  out: string - Directory to output compiled CSS
*/
module.exports = function(globs, out) {
  var partialFilter = filter(['**', '!**/_*.less']);
  var baseDirs = deglob(globs);

  var ret = gulp.src(globs)
    .pipe(partialFilter)
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: _.map(baseDirs, function(d) { path.resolve(d); })
    }))
    .on('error', function(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe(autoprefixer({
      browsers: ['last 3 versions']
    }));

  if (production.isSet()) {
    // External source maps + minimize + MD5 revision
    ret = ret.pipe(minifyCss({ zindex: false }))
             .pipe(rev())
             .pipe(sourcemaps.write("./"))
             .pipe(gulp.dest(out))
             .pipe(rev.manifest(
               "css-" + randomstring.generate(7) + ".manifest.json"
              ))
             .pipe(gulp.dest(out));
  } else {
    // Inline source maps
    ret = ret
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(out));
  }
  return ret;
};
