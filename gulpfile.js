"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    cached = require("gulp-cached"),
    less = require("gulp-less"),
    livereload = require("livereload"),
    path = require("path"),
    rename = require("gulp-rename"),
    sourcemaps = require("gulp-sourcemaps");

gulp.task("build-less", function() {
  return gulp.src(path.join(config.lessDir, "**/*.less"))
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: [ path.join(__dirname, config.lessDir) ]
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(path.join(config.pubDir, "less")));
});

// Make sure LESS compilation happens AFTER building CSS so that pre-compiled
// CSS doesn't clobber our more recently compiled LESS files
gulp.task("build-css", gulp.series(function() {
  return gulp.src(path.join(config.cssDir, "**/*.css"))
    .pipe(gulp.dest(path.join(config.pubDir, "css")));
}, "build-less"));

gulp.task("build-js", function() {
  return gulp.src(path.join(config.jsDir, "**/*.js"))
    .pipe(gulp.dest(path.join(config.pubDir, "js")));
});

gulp.task("build-img", function() {
  return gulp.src(path.join(config.jsDir, "**/*.*"))
    .pipe(gulp.dest(path.join(config.pubDir, "img")));
});

gulp.task("build-html", function() {
  return gulp.src(path.join(config.htmlDir, "**/*.html"))
    // Get rid of extension
    .pipe(rename(function (path) {
      path.extname = "";
    }))
    .pipe(gulp.dest(config.pubDir));
});

gulp.task("build", gulp.parallel("build-css", 
                                 "build-html", 
                                 "build-js",
                                 "build-img"));

gulp.task("default", gulp.series("build"));
