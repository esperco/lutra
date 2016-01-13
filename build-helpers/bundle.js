"use strict";
var _ = require("lodash"),
    browserify = require("browserify"),
    buffer = require("vinyl-buffer"),
    envify = require("envify/custom"),
    fs = require("fs"),
    gulp = require("gulp"),
    gutil = require("gulp-util"),
    merge = require("merge-stream"),
    path = require("path"),
    production = require("./production"),
    source = require("vinyl-source-stream"),
    sourcemaps = require("gulp-sourcemaps"),
    uglify = require("gulp-uglify"),
    watchify = require("watchify");

/*
  Use to create browserify bundles of non-global vendor files for Gulp v4

  entryFile: string - Entry point for bundle
  outFile: string - Output for bundle
  watch: boolean - Use watchify?
*/
module.exports = function(entryFiles, outDir, watch) {
  return merge.apply(null,
    _.map(entryFiles, function(file) {
      return createBundle(file, outDir, watch);
    })
  );
}

// Helper function used above
var createBundle = function(entryFile, outDir, watch) {
  var bundleName = path.basename(entryFile);

  /*
    Bundling is an expensive process, so if bundle already exists and is newer
    than entryFile, skip build
  */
  if (!watch && checkBundle(entryFile, path.join(outDir, bundleName))) {
    console.log(entryFile + " exists -- skipping");
    return gulp.src("*.empty-stream");
  }

  var opts = {
    entries: [entryFile],

    // Debug => true, get sourceMaps. We'll rely on sourcemaps to pull out
    // into external file for production
    debug: true,

    // Full Paths => easier to debug
    fullPaths: watch,

    // For watchify
    cache: {},
    packageCache: {}
  };

  var bundler = browserify(opts);
  if (watch) {
    bundler = watchify(bundler);
  }

  // Replace NODE_ENV with production if applicable
  bundler.transform(envify({
    NODE_ENV: process.env.NODE_ENV
  }));

  // Gets called on update, triggers rebundle
  function rebundle() {
    var stream = bundler.bundle()
      .on('error', gutil.log)
      .pipe(source(bundleName))
      .pipe(buffer());

    if (production.isSet()) {
      stream = stream

        // Load Browserify's inline sourcemaps
        .pipe(sourcemaps.init({loadMaps: true}))

        // Minimization
        .pipe(uglify({
          output: {
            "ascii_only": true
          }
        }))

        // Write sourcemap to external file
        .pipe(sourcemaps.write("./"))
    }

    return stream.pipe(gulp.dest(outDir));
  }

  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });
  bundler.on('error', gutil.log)
  bundler.on('log', gutil.log); // output build logs to terminal
  return rebundle();
}

// Returns true if a bundle file exists and is newer than its source
function checkBundle(entryFile, bundleFile) {
  var entryStat, bundleStat;
  entryStat = fs.statSync(entryFile);
  try {
    bundleStat = fs.statSync(bundleFile);
  } catch (err) {
    return false;
  }
  return bundleStat.mtime.getTime() > entryStat.mtime.getTime();
}
