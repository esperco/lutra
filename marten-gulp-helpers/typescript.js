module.exports = function(gulp) {
  'use strict';

  var browserify    = require("browserify"),
      buffer        = require("vinyl-buffer"),
      gutil         = require("gulp-util"),
      path          = require('path'),
      replace       = require('gulp-replace'),
      source        = require("vinyl-source-stream"),
      sourcemaps    = require('gulp-sourcemaps'),
      tsify         = require('tsify'),
      uglify        = require('gulp-uglify'),
      watchify      = require('watchify');

  var exports = {};

  var preBundle = function(config, watch) {
    // Debug = true => sourcemaps
    var ret = browserify(config.tsIn, {debug: true, verbose: true})
      .plugin(tsify, config.tsCompilerOpts || {});

    if (watch) {
      ret = watchify(ret);
      ret.on("update", function() {
        console.log("TypeScript recompiling");
        bundle(ret, config);
      });
      ret.on("log", gutil.log);
    }

    return ret;
  };

  var bundle = function(b, config) {
    var bundleName = path.basename(config.tsOut);
    var bundleDir = path.join(config.pubDir, path.dirname(config.tsOut));

    var ret = b.bundle()
      // Handle bundling errors
      .on("error", function(err) {
        gutil.log(gutil.colors.magenta(err.toString()));
      })

      // Convert Browserify stream to Vinyl stream/buffer for gulp
      .pipe(source(bundleName))
      .pipe(buffer());


    // Make sure productionVar exists so we don't accidentally replace
    // a bunch of "undefined"s.
    if (config.productionVar) {
      // RegEx does a simple word check -- this isn't totally safe
      // since var could be in string, so hope that it's unique
      var regEx = new RegExp("\\b" + config.productionVar + "\\b", "g");
      ret = ret.pipe(replace(regEx, (!!config.production).toString()));
    }

    if (config.production) {
      // loadMaps = true so we can load tsify/browserify sourcemaps
      ret = ret.pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify()) // Should remove unreachable dev only code
        .pipe(sourcemaps.write("./"));
    }

    return ret.pipe(gulp.dest(bundleDir));
  };

  exports.build = function(name, config) {
    name = name || "build-ts";

    gulp.task(name, function() {
      var b = preBundle(config, false);
      return bundle(b, config);
    });
  };

  exports.watch = function(name, config) {
    name = name || "watch-ts";

    gulp.task(name, function() {
      var b = preBundle(config, true);
      // No return, since watch never actually finishes
      bundle(b, config);
    });
  };

  return exports;
};