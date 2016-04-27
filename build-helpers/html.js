"use strict";
/*  */

var data = require("gulp-data"),
    deglob = require("./deglob"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    minify = require("gulp-htmlmin"),
    nunjucksRender = require("gulp-nunjucks-render"),
    production = require("./production"),
    rename = require("gulp-rename"),
    version = require("./version"),
    watch = require("./watch");
/*
  Compile HTML templates using nunjucks (Jinja) syntax

  globs: string[] - Paths to HTML globs
  out: string - Pub dir
  context: any - Data to pass to nunjucks
*/
module.exports = function(globs, out, context) {
  if (! globs instanceof Array) {
    globs = [globs];
  }

  // Pass search paths to nunjucks based on globs
  var baseDirs = deglob(globs);
  nunjucksRender.nunjucks.configure(baseDirs, {
    watch: !!watch.watchMode
  });

  // Don't create stand-alone files for partials. Nunjucks checks filesystem
  // directly for partial resolution, so no need to filter mid-stream.
  //
  // Concat rather than push to avoid mutation
  globs = globs.concat(["!**/_*.html"]);

  // Add production to context by default
  context = context || {};
  context.PRODUCTION = production.isSet();
  context.VERSION = context.VERSION || version();

  var ret = gulp.src(globs)
    .pipe(data(function() { return context; }))
    .pipe(nunjucksRender({
      path: baseDirs
    }))
    .on("error", function(err) {
      gutil.log(gutil.colors.red(err.name),
        "in", err.fileName, ":", err.message);
    });

  if (production.isSet()) {
    ret = ret.pipe(minify({
      collapseWhitespace: true,
      conservativeCollapse: true
    }));
  }

  /*
    Save file twice -- once with .html extension and once without. So long as
    server specifies correct mime-type, end-user can access pages with or
    without the .html extension. Ideally, we'd like to use redirects to
    a canonical path, but this is a "good-enough" solution we can use with
    "dumb" hosting solutions like Amazon S3.
  */
  return ret
    .pipe(gulp.dest(out))
    .pipe(rename({ extname: "" }))
    .pipe(gulp.dest(out))
};


