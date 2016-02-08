var _             = require('lodash'),
    gulp          = require('gulp'),
    cached        = require('gulp-cached'),
    exec          = require('gulp-exec'),
    filter        = require('gulp-filter'),
    fs            = require('fs'),
    glob          = require("glob"),
    merge         = require('merge-stream'),
    minimatch     = require('minimatch'),
    path          = require('path'),
    production    = require('./production'),
    remember      = require('gulp-remember'),
    sourcemaps    = require('gulp-sourcemaps'),
    ts            = require('gulp-typescript'),
    typescript    = require('typescript'),
    uglify        = require('gulp-uglify'),
    watch         = require('./watch');

// Cache of TS config projects (used for incremental compilation)
var projects = {};

// Path to oblivion binary (relative to Lutra root)
var OBLIVION_BIN = "setup/bin/oblivion";

/*
  Returns functions for building and compiling TypeScript projects.
  Supports using Oblivion.

  tsConfigPaths: string[] - Paths to a config file (relative to CWD of
    gulpfile). Config file should be in the form of a tsconfig.json file with
    an `outFile` and no `files` attribue (all files in directory get globbed)
    and with the following optional extra vars:

    devOnly?: string[] - Files used only in development
    prodOnly?: string[] - Files used only in production
    oblivion?: boolean - Pre-process with Oblivion?

  commonGlobs?: string[] - "Common" glob paths to add to path for each tsConfig
  outDir?: string - Path to output directory (modifies tsConfig.outFile path
    for Gulp output)
*/
module.exports = function(tsConfigPaths, commonGlobs, outDir) {
  'use strict';

  var buildFns = _.map(tsConfigPaths, function(p) {
    return function() { return buildOne(p, commonGlobs, outDir) };
  });

  var watchFns = _.map(tsConfigPaths, function(p) {
    return watchOne(p, commonGlobs, outDir);
  });

  return {
    build: gulp.parallel.apply(gulp, buildFns),
    watch: gulp.parallel.apply(gulp, watchFns)
  }
}

// Helper function for a single tsconfig.json file
var buildOne = function(tsConfigPath, commonGlobs, outDir) {
  'use strict';

  console.log("Building " + tsConfigPath);

  var relPath = path.relative(__dirname, process.cwd());
  var config = require(path.join(relPath, tsConfigPath));
  var compilerOpts = config.compilerOptions || {};
  var project = projects[tsConfigPath];
  if (! project) {
    project = projects[tsConfigPath] = ts.createProject(_.extend({
      // In theory, noExternalResolve should be faster but it isn't for
      // in practice. Disable for now.
      noExternalResolve: false,

      sortOutput: true,
      typescript: typescript
    }, compilerOpts));
  }

  // Include all files in tsconfig dir
  var base = path.dirname(tsConfigPath);
  var baseGlob = path.join(base, "**", "*.{ts,tsx}");
  var files = glob.sync(baseGlob);

  // Files are relative to tsconfig.json file. Adjust paths so they're
  // relative to cwd before processing
  function adjustPaths(f) {
    f = path.join(base, f);
    return path.relative(process.cwd(), f);
  }

  /*
    Prod => Exclude dev files and explicitly add prod files
    Dev => Exclude prod files and explicitly add dev files
    Explicit add necessary because we may want to add files outside
      the tsconfig base dir on a one-off basis.
  */
  var devFiles = _.map(config.devOnly, adjustPaths);
  var prodFiles = _.map(config.prodOnly, adjustPaths);
  var exclusions = [];
  if (production.isSet()) {
    exclusions = devFiles;
    files = prodFiles.concat(files);
  } else {
    exclusions = prodFiles;
    files = devFiles.concat(files);
  }
  _.remove(files, function(f) {
    return !!_.find(exclusions, function(e) {
      return minimatch(f, e);
    });
  });

  var ret = gulp.src(commonGlobs.concat(files), { base: "." });

  /*
    Oblivion is a custom JS/TS pre-processor that converts HTML-like code to
    jQuery DOM insertions -- this is deprecated in favor of React in newer
    code, but a lot of existing TS code uses Oblivion, so keep support for now.
  */
  if (config.oblivion) {
    var oblivionPath = path.resolve(__dirname, "..", OBLIVION_BIN)
    var filterDefs = filter(['**/*.ts', '!**/*.d.ts'], {restore: true});
    ret = ret
      .pipe(cached(tsConfigPath + " oblivion"))
      .pipe(filterDefs)
      .pipe(exec(oblivionPath + " -ts <%= file.path %>", {
        continueOnError: true,
        pipeStdout: true
      }))
      .pipe(exec.reporter({
        stdout: false   // Don't report stdout, just pipe to output
      }))
      .pipe(filterDefs.restore)
      .pipe(remember(tsConfigPath + " oblivion"));
  }

  // Use file lists to filter out un-needed files
  var tsRefFilter = {referencedFrom: files};

  /*
    TypeScript error/success reporter -- alternatives include:
      - ts.reporter.nullReporter()
      - ts.reporter.longReporter()
      - ts.reporter.fullReporter()
  */
  var reporter = ts.reporter.defaultReporter();

  /*
    Wrap reporter so that not watching files and automatically re-
    compiling, we throw a non-zero error code on failure
  */
  if (! watch.watchMode) {
    var oldHandler = reporter.finish;
    reporter.finish = function(results) {
      oldHandler.call(this, results);
      if (results.transpileErrors ||
          results.syntaxErrors ||
          results.globalErrors ||
          results.semanticErrors ||
          results.emitErrors ||
          results.emitSkipped) {
        process.exit(1);
      }
    };
  }

  ret = ret
    .pipe(sourcemaps.init())
    .pipe(ts(project, tsRefFilter, reporter));

  if (production.isSet()) {
    // loadMaps = true so we can load tsify/browserify sourcemaps
    ret = ret
      .pipe(uglify({
        output: {
          "ascii_only": true
        }
      }))
      // External sourcemaps so we don't defeat the purpose of uglifying
      .pipe(sourcemaps.write("./"));
  } else {
    // Inline sourcemaps for dev because it often doesn't work if
    // it's external and we care more about proper sourcemaps and less
    // about file-size in dev than production
    ret = ret.pipe(sourcemaps.write());
  }

  return ret.pipe(gulp.dest(outDir))
    .on('end', function() { console.log(tsConfigPath, 'done'); });
}

// Watch a single tsConfigFile
var watchOne = function(tsConfigPath, commonGlobs, outDir) {
  'use strict';

  var base = path.dirname(tsConfigPath);
  var baseGlob = path.join(base, "**", "*.{ts,tsx}");
  var tsGlobs = [baseGlob].concat(commonGlobs);

  return watch(gulp)(tsGlobs, function() {
    return buildOne(tsConfigPath, commonGlobs, outDir);
  });
}
