module.exports = function(gulp) {
  "use strict";

  var childProcess  = require('child_process'),
      chalk         = require('chalk'),
      mkdirp        = require('mkdirp'),
      path          = require('path');

  var exports = {};

  /** Spawn a TSC process or watcher -- use tsconfig.json to configure
    * @param {string} [opts.tscPath="tsc"] - Command line arg for tsc
    * @param {boolean} [opts.watch] - If true, turns on watch mode
    * @param {boolean} [opts.cwd] - Working directory to use for our process
    * @param {boolean} [opts.inlineSources] - Inline sources (use if external
    *   source maps are buggy, but only in dev!)
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
    if (opts.watch) {
      tscArgs.push("-w");
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

  var buildName; // Set this var so knows how to referenec build
  exports.build = function(name, config) {
    buildName = name || "build-ts";
    return gulp.task(buildName, function(cb) {
      mkdirp(path.join(config.pubDir, config.tscOutDir), function(err) {
        if (err) {
          console.error(err);
        } else {
          spawnTsc({inlineSources: !!config.production}, cb);
        }
      });
    });
  };

  exports.watch = function(name) {
    name = name || "watch-ts";
    return gulp.task(name, function(cb) {
      return spawnTsc({watch: true, inlineSources: true}, cb);
    });
  };

  return exports;
};
