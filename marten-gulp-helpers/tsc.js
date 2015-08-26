module.exports = function(gulp) {
  "use strict";

  var _             = require('lodash'),
      childProcess  = require('child_process'),
      chalk         = require('chalk'),
      fs            = require('fs'),
      path          = require('path'),
      replace       = require('gulp-replace'),
      sourcemaps    = require('gulp-sourcemaps'),
      temp          = require('temp'),
      uglify        = require('gulp-uglify');

  var exports = {};

  /** Spawn a TSC process or watcher -- use tsconfig.json to configure
   *  @param {string} [opts.tscPath="tsc"] - Command line arg for tsc
   *  @param {boolean} [opts.watch] - If true, turns on watch mode
   *  @param {boolean} [opts.cwd] - Working directory to use for our process
   *  @param {string} [opts.out] - Pick a single output file
   *  @param {string} [opts.outDir] - Pick an output directory
   *  @param {boolean} [opts.inlineSources] - Inline sources (use if external
   *    source maps are buggy, but only in dev), else external source map
   *  @param {boolean} [opts.exitOnError] - Exit if TSC outputs stderr
   *  @param {function} cb - Callback when compiler process is complete
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
    if (opts.out) {
      tscArgs.push("--out");
      tscArgs.push(opts.out);
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

  // Name for intermediate TS bundle in our temp directory
  var getTempFile = function(config) {
    return path.join(getTempDir(), path.basename(config.tsOut));
  };

  // Get the path to the compiler based on config -- use ntsc if set
  var tscPath = function(config) {
    var ret;
    if (config.useNtsc) {
      ret = path.join(__dirname, "node_modules", ".bin", "ntsc");
    } else {
      ret = path.join(__dirname, "node_modules", ".bin", "tsc");
    }
    console.log("Using " + ret);
    return ret;
  };

  // Gulp code to process concatenated TS bundle
  var postTsc = function(config) {
    var bundleDir = path.join(config.pubDir, path.dirname(config.tsOut));
    var ret = gulp.src(getTempFile(config));

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
    return gulp.task(name, gulp.series(
      function(cb) {
        var tsConfig = _.extend({}, config.tsConfig);
        if (config.production && config.tsInProd) {
          tsConfig.files = [config.tsInProd];
        } else {
          tsConfig.files = [config.tsIn];
        }
        fs.writeFile("./tsconfig.json", JSON.stringify(tsConfig), cb);
      },
      function(cb) {
        spawnTsc({inlineSources: true,
                  tscPath: tscPath(config),
                  out: getTempFile(config)}, cb);
      },
      function() {
        return postTsc(config);
      }
    ));
  };

  exports.watch = function(name, config) {
    name = name || "watch-ts";
    return gulp.task(name, gulp.parallel(
      function(cb) {
        return spawnTsc({ watch: true,
                          inlineSources: true,
                          tscPath: tscPath(config),
                          out: getTempFile(config)}, cb);
      },
      function() {
        return gulp.watch(getTempFile(config), function() {
          return postTsc(config);
        });
      }));
  };

  return exports;
};
