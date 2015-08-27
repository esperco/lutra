module.exports = function(gulp) {
  'use strict';

  var _             = require("lodash"),
      gutil         = require("gulp-util"),
      path          = require('path'),
      sourcemaps    = require('gulp-sourcemaps'),
      ts            = require('gulp-typescript'),
      uglify        = require('gulp-uglify');

  var exports = {};

  var getTsGlobs = function(proj, config) {
    var extra = config.production ? proj.prodGlobs : proj.devGlobs;
    return proj.globs.concat(extra || []);
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
        var ret = gulp.src(getTsGlobs(proj, config), { base: "." })
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