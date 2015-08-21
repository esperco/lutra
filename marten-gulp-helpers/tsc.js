module.exports = function(gulp) {
  "use strict";

  var childProcess  = require('child_process'),
      chalk         = require('chalk'),
      mkdirp        = require('mkdirp'),
      path          = require('path'),
      replace       = require('gulp-replace'),
      sourcemaps    = require('gulp-sourcemaps'),
      temp          = require('temp'),
      uglify        = require('gulp-uglify');

  var exports = {};

  /** Spawn a TSC process or watcher -- use tsconfig.json to configure
    * @param {string} [opts.tscPath="tsc"] - Command line arg for tsc
    * @param {boolean} [opts.watch] - If true, turns on watch mode
    * @param {boolean} [opts.cwd] - Working directory to use for our process
    * @param {string} [opts.outDir] - Pick an output directory
    * @param {boolean} [opts.inlineSources] - Inline sources (use if external
    *   source maps are buggy, but only in dev), else external source map
    * @param {boolean} [opts.exitOnError] - Exit if TSC outputs stderr
    * @param {function} cb - Callback when compiler process is complete
  */
  var spawnTsc = function(opts, cb) {
    if (typeof opts === "function" && !cb) {
      cb = opts;
      opts = {};
    } else {
      opts = opts || {};
    }

    // Put together args for Typescript
    var tscArgs = [];
    if (opts.inlineSources) {
      tscArgs.push("--inlineSourceMap");
      tscArgs.push("--inlineSources");
    }
    else {
      tscArgs.push("--sourceMap");
    }
    if (opts.watch) {
      tscArgs.push("-w");
    }
    if (opts.outDir) {
      tscArgs.push("--outDir");
      tscArgs.push(opts.outDir);
    }

    // Process options
    var psOpts = {};
    if (opts.cwd) {
      psOpts.cwd = opts.cwd;
    }

    // Spawn process
    var ps = childProcess.spawn(opts.tscPath || "tsc", tscArgs, psOpts);

    // Helper for handling end of process events
    var handleEnd = function(code) {
      if (code !== 0) { // Error
        console.error(chalk.red("Error code " + code));
        if (opts.exitOnError) {
          process.exit(code);
        }
      }
      cb();
    };

    // Events
    ps.stdout.on("data", function(data) {
      var str = data.toString();

      // Manually check stdout for errors since tsc doesn't always write to
      // stderr for errors
      if (str.indexOf(": error TS") > -1) {
        process.stderr.write(chalk.red(str));
      } else {
        process.stdout.write(str);
      }
    });

    ps.stderr.on("data", function(data) {
      process.stderr.write(chalk.red(data.toString()));
    });

    ps.on("error", cb);
    ps.on("exit", handleEnd);
    ps.on("close", handleEnd);

    return ps;
  };

  // Variable to hold a temporary directory created for the duration of this
  // task. Temp dir will be cleaned up on exit.
  var tempDir;
  var getTempDir = function() {
    if (! tempDir) {
      temp.track();     // Remove to disable cleanup
      tempDir = temp.mkdirSync();
      console.log("Using " + tempDir + " as temp dir");
    }
    return tempDir;
  };

  var buildName; // Set this var so knows how to reference build
  exports.build = function(name, config) {
    buildName = name || "build-ts";
    return gulp.task(buildName, gulp.series(

      // Use TSC process to write out to file
      function(cb) {
        mkdirp(path.join(config.pubDir, config.tscOutDir), function(err) {
          if (err) {
            console.error(err);
          } else {
            spawnTsc({inlineSources: true,
                      outDir: config.production ? getTempDir() : null}, cb);
          }
        });
      },

      // If production, above command wrote out to temp dir. Grab temp files,
      // replace production var and uglify, and then pipe to pub directory.
      function(cb) {
        if (config.production) {
          var ret = gulp.src(path.join(getTempDir(), "**/*.js"))
            .pipe(sourcemaps.init({loadMaps: true}));

          // Make sure productionVar exists so we don't accidentally replace
          // a bunch of "undefined"s.
          if (config.productionVar) {
            // RegEx does a simple word check -- this isn't totally safe
            // since var could be in string, so hope that it's unique
            var regEx = new RegExp("\\b" + config.productionVar + "\\b", "g");
            ret = ret.pipe(replace(regEx, "true"));
          }

          return ret
            .pipe(uglify()) // Should remove unreachable dev only code
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest(path.join(config.pubDir, config.tscOutDir)));
        }
        else { cb(); /* Nothing to do */ }
      }
    ));
  };

  exports.watch = function(name) {
    name = name || "watch-ts";
    return gulp.task(name, function(cb) {
      return spawnTsc({watch: true, inlineSources: true}, cb);
    });
  };

  return exports;
};
