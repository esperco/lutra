module.exports = function(gulp) {
  'use strict';

  var _             = require("lodash"),
      gutil         = require("gulp-util"),
      path          = require('path'),
      sourcemaps    = require('gulp-sourcemaps'),
      ts            = require('gulp-typescript'),
      uglify        = require('gulp-uglify');

  var exports = {};

  var getTsGlobs = function(config) {
    var extra = config.production ? config.tsProdGlobs : config.tsDevGlobs;
    return config.tsGlobs.concat(extra || []);
  };

  var buildName; // Used by watch below
  exports.build = function(name, config) {
    buildName = name || "build-ts";

    var bundleName = path.basename(config.tsOut);
    var bundleDir = path.join(config.pubDir, path.dirname(config.tsOut));
    var tsProject = ts.createProject(_.extend({
      noExternalResolve: true,
      sortOutput: true,
      typescript: ( config.tsConfig && config.tsConfig.jsx ?
                    require("ntypescript") : require("typescript") ),
      out: bundleName
    }, config.tsConfig));

    gulp.task(buildName, function() {
      var ret = gulp.src(getTsGlobs(config), { base: "." })
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

      if (config.production) {
        // loadMaps = true so we can load tsify/browserify sourcemaps
        ret = ret
          .pipe(uglify())
          // External sourcemaps so we don't defeat the purpose of uglifying
          .pipe(sourcemaps.write("./"));
      } else {
        // Inline sourcemaps for dev because it often doesn't work if
        // it's external and we care more about proper sourcemaps and less
        // about file-size in dev than production
        ret = ret.pipe(sourcemaps.write());
      }

      return ret
        .on("error", gutil.log)
        .pipe(gulp.dest(bundleDir));
    });
  };

  exports.watch = function(name, config) {
    name = name || "watch-ts";
    gulp.task(name, function() {
      return gulp.watch(getTsGlobs(config), gulp.series(buildName));
    });
  };

  return exports;
};