"use strict";

// Use to create a browserify bundle of non-global vendor files for Gulp v4
module.exports = function(gulp) {
  var browserify = require("browserify"),
      buffer = require("vinyl-buffer"),
      debowerify = require("debowerify"),
      deglobalify = require("deglobalify"),
      fs = require("fs"),
      gutil = require("gulp-util"),
      path = require("path"),
      source = require("vinyl-source-stream");

  var exports = {};

  // Browserify bundle for Bower components
  var buildName; // Set so watch can find
  exports.build = function(name, config) {
    buildName = name || "build-vendor";

    var bundleName  = path.basename(config.vendorJSOut),
        bundleDir   = path.dirname(config.vendorJSOut);

    return gulp.task(buildName, function() {
      return browserify(config.vendorJSIndex, {debug: !!config.production})

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
        .pipe(buffer())

        // Output vendor bundle to file
        .pipe(gulp.dest(path.join(config.pubDir, bundleDir)));
    });
  };

  // Watch and recompile if new vendor files are added
  exports.watch = function(name, config) {
    name = name || "watch-vendor";

    // (A) Watch the vendor index file and (b) the vendor directory
    var watchTargets = [config.vendorJSIndex];

    // (B) Watch the vendor directory as well (either bower_components or
    // set via the .bowerrc file) in Marten
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
    var vendorRoot = (bowerRc && bowerRc.directory) || "bower_components";
    watchTargets.push(path.join(martenRoot, vendorRoot, "**", "*.*"));
    console.log(watchTargets);

    return gulp.task(name, function() {
      return gulp.watch(watchTargets, gulp.series(buildName));
    });
  };

  return exports;
};