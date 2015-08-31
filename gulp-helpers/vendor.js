"use strict";

// Use to create a browserify bundle of non-global vendor files for Gulp v4
module.exports = function(gulp) {
  var _ = require("lodash"),
      browserify = require("browserify"),
      buffer = require("vinyl-buffer"),
      concat = require("gulp-concat"),
      debowerify = require("debowerify"),
      deglobalify = require("deglobalify"),
      fs = require("fs"),
      gutil = require("gulp-util"),
      minifyCss = require("gulp-minify-css"),
      path = require("path"),
      source = require("vinyl-source-stream"),
      sourcemaps = require("gulp-sourcemaps"),
      uglify = require("gulp-uglify");

  var exports = {};

  // This variable can be set by the build-once task and allows us to skip
  // time-consuming Gulp tasks if there's already a JS bundle
  var skip = false;

  // Get the vendor directory used by Bower
  var vendorDir; // Store cached vendor dir
  var getVendorDir = exports.getVendorDir = function() {
    if (! vendorDir) {
      var martenRoot = path.resolve(__dirname + "/..");
      var bowerRc;
      try {
        bowerRc = JSON.parse(
          fs.readFileSync(path.join(martenRoot, ".bowerrc"), "utf8")
        );
      } catch (err) {
        // Do nothing -> absence or bad .bowerc means we default to
        // bower_components
      }
      vendorDir = path.join(martenRoot,
        (bowerRc && bowerRc.directory) || "bower_components");
    }
    return vendorDir;
  };

  // Browserify bundle for Bower components
  var buildJSName; // Set so build can find
  exports.buildJS = function(name, config) {
    buildJSName = name || "build-vendor-js";

    var bundleName  = path.basename(config.vendorJSOut),
        bundleDir   = path.dirname(config.vendorJSOut);

    return gulp.task(buildJSName, function(cb) {
      if (skip) { cb(); return; }

      // Debug => true, get sourceMaps. We'll rely on sourcemaps to pull out
      // into external file for production
      var ret = browserify(config.vendorJSIndex, {debug: true})

        // This allows us to "require" Bower packages based on the "main"
        // value in their bower.json files
        .transform(debowerify)

        // No globals! See https://github.com/eugeneware/deglobalify for
        // how to require what would have been a global in your vendor index.
        .transform(deglobalify)

        .bundle()
        .on("error", gutil.log)

        // Convert Browserify stream to Vinyl stream and buffer for Gulp
        .pipe(source(bundleName))
        .pipe(buffer());

      // Uglify production and remove sourcemaps
      if (config.production) {
        // Load Browserify's inline sourcemaps
        ret = ret.pipe(sourcemaps.init({loadMaps: true}))

          // Minimization
          .pipe(uglify()).on("error", gutil.log)

          // Write sourcemap to external file
          .pipe(sourcemaps.write("./"));
      }

      // Output vendor bundle to file
      return ret.pipe(gulp.dest(path.join(config.pubDir, bundleDir)));
    });
  };

  // Concatenate and uglify CSS
  var buildCSSName; // Set so build can find
  exports.buildCSS = function(name, config) {
    buildCSSName = name || "build-vendor-css";

    var bundleName  = path.basename(config.vendorCSSOut),
        bundleDir   = path.dirname(config.vendorCSSOut);

    return gulp.task(buildCSSName, function(cb) {
      if (skip) { cb(); return; }

      var cssList = _.map(config.vendorCSSList, function(f) {
        return path.join(getVendorDir(), f);
      });
      var ret = gulp.src(cssList)
        .pipe(sourcemaps.init())
        .pipe(concat(bundleName));

      if (config.production) {
        // External sourcemaps + minimize
        ret = ret.pipe(minifyCss())
                 .pipe(sourcemaps.write("./"));
      } else {
        // Internal sourcemaps
        ret = ret.pipe(sourcemaps.write());
      }

      return ret.pipe(gulp.dest(path.join(config.pubDir, bundleDir)));
    });
  };

  // Copy assets without change (e.g. fonts)
  var buildAssetsName; // Set so build can find
  exports.buildAssets = function(name, config) {
    buildAssetsName = name || "build-vendor-assets";

    // Reverse so destinations are used as keys to array of globs, and
    // prefix source globs with vendor root
    var destinations = {};
    _.each(config.vendorAssets, function(dest, srcGlob) {
      destinations[dest] = destinations[dest] || [];
      destinations[dest].push(srcGlob);
    });

    // Create a separate Gulp task for each destination with a postfix
    var taskNames = [];
    _.each(destinations, function(srcGlobList, dest) {
      var taskName = buildAssetsName + "-" + dest;
      taskNames.push(taskName);
      srcGlobList = _.map(srcGlobList, function(srcGlob) {
        return path.join(getVendorDir(), srcGlob);
      });

      return gulp.task(taskName, function(cb) {
        if (skip) { cb(); return; }
        return gulp.src(srcGlobList)
          .pipe(gulp.dest(path.join(config.pubDir, dest)));
      });
    });

    // Gulp task that calls all glob matchers in parallel
    return gulp.task(buildAssetsName, gulp.parallel(taskNames));
  };

  var buildName; // Set so watch can find
  exports.build = function(name, config) {
    buildName = name || "build-vendor";
    if (! buildJSName) {
      exports.buildJS(null, config);
    }
    if (! buildCSSName) {
      exports.buildCSS(null, config);
    }
    if (! buildAssetsName) {
      exports.buildAssets(null, config);
    }
    return gulp.task(buildName,
      gulp.parallel(buildJSName, buildCSSName, buildAssetsName));
  };

  // Vendor building takes a while and is infrequent -- this only builds if
  // there are no existing vendor JS files
  exports.buildOnce = function(name, config) {
    name = name || "build-vendor-once";
    if (! buildName) {
      exports.build(null, config);
    }
    return gulp.task(name, gulp.series(function(cb) {
      var fullPath = path.join(config.pubDir, config.vendorJSOut);
      skip = true;
      try {
        fs.statSync(fullPath);
      } catch (err) {
        skip = false;
      }
      cb();
    }, buildName));
  };

  // Watch and recompile if new vendor files are added
  exports.watch = function(name, config) {
    name = name || "watch-vendor";

    // (A) Watch the vendor index file and (b) the vendor directory
    var watchTargets = [config.vendorJSIndex,
                        path.join(getVendorDir(), "**/*.*")];

    return gulp.task(name, function() {
      return gulp.watch(watchTargets, gulp.series(buildName));
    });
  };

  return exports;
};