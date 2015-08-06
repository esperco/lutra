"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    _ = require("lodash"),
    cached = require("gulp-cached"),
    ecstatic = require("ecstatic"),
    del = require("del"),
    filter = require("gulp-filter"),
    http = require("http"),
    less = require("gulp-less"),
    livereload = require("livereload"),
    path = require("path"),
    rename = require("gulp-rename"),
    sourcemaps = require("gulp-sourcemaps");

// NB: No caching for LESS since it could reference other LESS files
gulp.task("build-less", function() {
  return gulp.src(path.join(config.lessDir, "**/*.less"))
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: [ path.join(__dirname, config.lessDir) ]
    }))
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(path.join(config.pubDir, "css")));
});

// Make sure LESS compilation happens AFTER building CSS so that pre-compiled
// CSS doesn't clobber our more recently compiled LESS files
gulp.task("build-css", gulp.series(function() {
  return gulp.src(path.join(config.cssDir, "**/*.css"))
    .pipe(cached("css"))
    .pipe(gulp.dest(path.join(config.pubDir, "css")));
}, "build-less"));

// TODO: Uglify, concatenate, all that jazz
gulp.task("build-js", function() {
  return gulp.src(path.join(config.jsDir, "**/*.js"))
    .pipe(cached("css"))
    .pipe(gulp.dest(path.join(config.pubDir, "js")));
});

gulp.task("build-img", function() {
  return gulp.src(path.join(config.imgDir, "**/*.*"))
    .pipe(cached("img"))
    .pipe(gulp.dest(path.join(config.pubDir, "img")));
});

gulp.task("build-html", function() {
  // Get rid of extension, except for index.html
  var indexFilter = filter(["*", "!index.html"], {restore: true});

  return gulp.src(path.join(config.htmlDir, "**/*.html"))   
    .pipe(cached("html")) 
    .pipe(indexFilter)
    .pipe(rename(function (path) {
      path.extname = "";
    }))
    .pipe(indexFilter.restore)
    .pipe(gulp.dest(config.pubDir));
});

// Launch a live-reload server that watches the public directory and sends
// a websocket notification if things change. Use in conjunction with a
// LiveReload browser extension. Uses port 35729 by default.
gulp.task("live-reload", function() {
  var server = livereload.createServer({
    port: config.liveReloadPort
  });
  server.watch(config.pubDir);
  return server;
});

// Launch an HTML server that serves the contents in the pub dir with the 
// correct content type
gulp.task("html-server", function() {   
  return http.createServer(
    ecstatic({ root: path.join(__dirname, config.pubDir),
               contentType: 'text/html' })
  ).listen(config.serverPort);
});

gulp.task("build", gulp.parallel("build-css", 
                                 "build-html", 
                                 "build-js",
                                 "build-img"));

gulp.task("clean", function(cb) {
  del(config.pubDir, cb);
});

gulp.task("watch", gulp.series("clean", "build",
  gulp.parallel("live-reload", "html-server", function() {
    var dirs = _.map([config.htmlDir, 
                      config.lessDir, 
                      config.cssDir, 
                      config.jsDir, 
                      config.imgDir], function(dir) {
      return path.join(dir, "**/*.*");
    });
    return gulp.watch(dirs, gulp.series("build"));
})));

gulp.task("default", gulp.series("build"));
