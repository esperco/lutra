"use strict";

// For your configuration pleasure
var config = require("./config");

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var gulp = require("gulp"),
    cached = require("gulp-cached"),
    childProcess = require('child_process'),
    exec = require("gulp-exec"),
    gutil = require("gulp-util"),
    livereload = require("livereload"),
    path = require("path"),
    temp = require("temp");

// Helper to just run a short-lived shell command
var shell = function(cmd, cb) {
  if (cmd instanceof Array) {
    cmd = cmd.join(" ");
  }
  childProcess.exec(cmd, function (err, stdout, stderr) {
    console.log(stdout);
    console.error(stderr);
    cb(err);
  });
};

// Set production mode - use a module-wide variable to determine 
gulp.task("production", function(done) {
  config.production = true;
  done();
});

// Variable to hold a temporary directory created for the duration of this
// task. Temp dir will be cleaned up on exit.
var tempDir;
var getTempDir = function() {
  temp.track();     // Remove to disable cleanup
  if (! tempDir) {
    tempDir = temp.mkdirSync();
    console.log("Using " + tempDir + " as temp dir");
  }
  return tempDir;
};

// Processes TS files with Oblivion and writes them to a temp directory.
// Using a temp directory isn't ideal from a streaming perspective, but it's
// tricky to apply the Oblivion transformation prior to TSify processing
// the require / reference 
gulp.task("build-oblivion", function() {
  return gulp.src(config.tsGlobs, {base: config.projectBase})
    .pipe(cached('build-oblivion')) // Only pass through changed file
    .pipe(exec(config.oblivionPath + " -ts <%= file.path %>", {
      continueOnError: true,
      pipeStdout: true
    }))
    .pipe(exec.reporter({
      stdout: false   // Don't report stdout, just pipe to output
    }))
    .on("error", gutil.log)
    .pipe(gulp.dest(getTempDir()));
});

// Uses appropriate conf file based on dev vs production
gulp.task("build-conf", function(cb) {
  var confSrc = config.production ? config.prodConf : config.devConf;
  confSrc = path.relative(config.projectBase, confSrc);
  confSrc = path.join(getTempDir(), confSrc);

  var confDest = path.relative(config.projectBase, config.confDest);
  confDest = path.join(getTempDir(), confDest);

  shell(["cp", confSrc, confDest], cb);
});

// Spawn a TypeScript compiler process that processes the given TS entry
// point file processed by Oblivion
// * [watch] - If true, turns on watch mode
// * cb - Callback when compiler process is complete
var spawnTsc = function(watch, cb) {
  if (typeof watch === "function" && !cb) {
    cb = watch;
    watch = false;
  } 

  // Put together args for Typescript
  var tscArgs = ["--out", path.join(config.pubDir, config.tsBundleName)];
  if (! config.production) {
    tscArgs.push("--inlineSourceMap");
  }
  if (watch) {
    tscArgs.push("-w");
  }

  // No Implicit Any currently disabled because there are a lot of implicit
  // any errors to fix
  // tscArgs.push("--noImplicitAny");

  // Get entry point relative to temp directory
  var relPath = path.relative(config.projectBase, config.tsEntryPoint);
  var entryPoint = path.join(getTempDir(), relPath);
  tscArgs.push(entryPoint);

  // Spawn process
  var ps = childProcess.spawn(config.tscPath, tscArgs);

  // Helper for handling end of process events
  var handleEnd = function(code) {
    if (code !== 0) { // Error
      console.error("Error code " + code);
    }
    cb();
  };

  // Wrapper around write stream that converts to string
  var writer = function(out) {
    return function(data) { out.write(data.toString()); };
  };

  // Events
  ps.stdout.on("data", writer(process.stdout));
  ps.stderr.on("data", writer(process.stderr));
  ps.on("error", cb);
  ps.on("exit", handleEnd);
  ps.on("close", handleEnd);

  return ps;
};

gulp.task("build-ts", gulp.series("build-oblivion", "build-conf", spawnTsc));

// Watcher to call build oblivion (and rebuild if src changes)
gulp.task("watch-oblivion", function() {
  return gulp.watch(config.tsGlobs, gulp.series("build-oblivion"));
});

// Launches tsc watcher from command line
gulp.task("watch-ts", gulp.parallel("watch-oblivion", function(cb) {
  spawnTsc(true, cb);
}));

// Launch a live-reload server that watches the public directory and sends
// a websocket notification if things change. Use in conjunction with a
// LiveReload browser extension. Uses port 35729 by default.
gulp.task("live-reload", function() {
  var server = livereload.createServer({
    port: config.liveReloadPort
  });
  server.watch(config.pubDir);
  return server;
});

// Ensure initial build betfore watching to set up temp dir
gulp.task("watch", gulp.series("build-ts", 
  gulp.parallel("live-reload", "watch-ts")));

gulp.task("build", gulp.series("build-ts"));

gulp.task("build-production", gulp.series("production", "build"));

gulp.task("default", gulp.series("build-production"));
