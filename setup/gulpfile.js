"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    cached = require("gulp-cached"),
    concat = require("gulp-concat"),
    exec = require("gulp-exec"),
    remember = require("gulp-remember"),
    sourcemaps = require("gulp-sourcemaps"),
    ts = require("gulp-typescript");

// Set production mode - use a module-wide variable to determine 
gulp.task("production", function(done) {
  config.production = true;
  done();
});

// A gulp-typescript project needs to exist in scope outside task to permit
// incremental compilation of Typescript. Doesn't appear to speed things up
// much because of bundling, but seems to be fine.
var tsProject = ts.createProject({
  /* Disabled because there are a lot of implicit any-s at the moment */
  // noImplicitAny: true,   

  // This option sorts by references
  sortOutput: true,

  // All requirements should be in the source path
  noExternalResolve: true
});

// Compile Typescript
gulp.task("build-ts", function() {
  var ret = gulp.src(config.tsGlobs)
    .pipe(cached('build-ts')) // Only pass through changed files

    // Run our TS files through Oblivion pre-processor first.
    .pipe(exec(config.oblivionPath + " -ts <%= file.path %>", {
      continueOnError: false,
      pipeStdout: true
    }));

  // Production => sourcemaps
  if (! config.production) {
    // Init sourcemap tracking (Oblivion doesn't support / need sourcemaps)
    ret = ret.pipe(sourcemaps.init());
  }

  ret = ret

    // We need to undo caching in order for Typescript compilation to check
    // references (unfortunately)
    .pipe(remember('build-ts'))

    // Compile Typescript to Javascript
    .pipe(ts(tsProject)).js

    // Bundle into a single file
    .pipe(concat(config.tsBundleName));

  if (! config.production) {
    // Use `soucemaps.write("./")` to write an external sourceMap, currently
    // omitting a path argument because external sourceMaps are incorrect
    // for some reason. Just make sure that this isn't run in production.
    ret = ret.pipe(sourcemaps.write());
  }
    
  // Write bundle to pubDir
  return ret.pipe(gulp.dest(config.pubDir));
});

gulp.task("build-ts-production", gulp.series("production", "build-ts"));

gulp.task("watch-ts", function() {
  return gulp.watch(config.tsGlobs, gulp.series("build-ts"));
});

gulp.task("default", gulp.series("build-ts"));
