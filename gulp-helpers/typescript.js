module.exports = function(gulp) {
  'use strict';

  var _             = require('lodash'),
      cached        = require('gulp-cached'),
      concat        = require('gulp-concat'),
      exec          = require('gulp-exec'),
      filter        = require('gulp-filter'),
      gutil         = require('gulp-util'),
      path          = require('path'),
      remember      = require('gulp-remember'),
      sourcemaps    = require('gulp-sourcemaps'),
      ts            = require('gulp-typescript'),
      tsRef         = require('gulp-typescript-ref'),
      uglify        = require('gulp-uglify');

  var exports = {};

  // Concatenate entry points to globs to ensure more consistent ordering
  var getTsGlobs = function(proj, config) {
    if (config.production && proj.prodIn) {
      return proj.prodIn.concat(proj.globs);
    } else if (proj.devIn) {
      return proj.devIn.concat(proj.globs);
    }
    return proj.globs;
  };

  // TS project names to keep track of, used by watch
  var buildNames = [];
  exports.build = function(name, config) {
    name = name || "build-ts";

    _.each(config.tsProjects || [], function(proj) {
      var bundleName = path.basename(proj.out);
      var bundleDir = path.join(config.pubDir, path.dirname(proj.out));
      var tsProject = ts.createProject(_.extend({
        noExternalResolve: true,
        sortOutput: true,
        typescript: ( proj.compilerOptions &&
                      proj.compilerOptions.jsx ?
                      require("ntypescript") : require("typescript") ),
        out: bundleName
      }, proj.compilerOptions));

      var buildName = name + " " + proj.out;
      buildNames.push(buildName);
      gulp.task(buildName, function() {
        var ret = gulp.src(getTsGlobs(proj, config), { base: "." });

        /*  Oblivion is a custom JS/TS pre-processor that converts HTML-like
            code to jQuery DOM insertions -- we should deprecate this, but a
            lot of existing TS code uses Oblivion, so keep support for now.
        */
        if (proj.oblivion) {
          var filterDefs = filter(['**/*.ts', '!**/*.d.ts'], {restore: true});
          ret = ret
            .pipe(cached(buildName + " oblivion"))
            .pipe(filterDefs)
            .pipe(exec(config.oblivionPath + " -ts <%= file.path %>", {
              continueOnError: true,
              pipeStdout: true
            }))
            .pipe(exec.reporter({
              stdout: false   // Don't report stdout, just pipe to output
            }))
            .pipe(filterDefs.restore)
            .pipe(remember(buildName + " oblivion"));
        }

        if (config.production && proj.prodIn) {
          ret = ret.pipe(tsRef(proj.prodIn));
        } else if (proj.devIn) {
          ret = ret.pipe(tsRef(proj.devIn));
        }

        ret = ret
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
    });

    gulp.task(name, gulp.parallel.apply(gulp, buildNames));
  };

  exports.watch = function(name, config) {
    name = name || "watch-ts";

    var watchNames = [];
    _.each(config.tsProjects || [], function(proj, index) {
      var watchName = name + " " + proj.out;
      watchNames.push(watchName);
      gulp.task(watchName, function() {
        return gulp.watch(getTsGlobs(proj, config),
          gulp.series(buildNames[index]));
      });
    });

    gulp.task(name, gulp.parallel.apply(gulp, watchNames));
  };

  return exports;
};