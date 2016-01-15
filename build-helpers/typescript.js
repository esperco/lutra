var _             = require('lodash'),
    gulp          = require('gulp'),
    cached        = require('gulp-cached'),
    exec          = require('gulp-exec'),
    filter        = require('gulp-filter'),
    fs            = require('fs'),
    merge         = require('merge-stream'),
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
  Gulp stream for compiling TypeScript. Supports using Oblivion.

  globs: string[] - Globs with source files
  tsConfigs: string[] - Paths to a config file (relative to CWD of gulpfile).
    Config file should be in the form of a tsconfig.json file with `outFile`,
    with the following optional extra vars:

    devFiles?: string[] - Files used only in development
    prodFiles?: string[] - Files used only in production
    oblivion?: boolean - Pre-process with Oblivion?

  outDir?: string - Path to output directory (modifies tsConfig.outFile path
    for Gulp output)
*/
module.exports = function(globs, tsConfigPaths, outDir) {
  'use strict';

  return merge.apply(null,
    _.map(tsConfigPaths, function(p) {
      return build(globs, p, outDir);
    })
  );
}

// Helper function for a single tsconfig.json file
var build = function(globs, tsConfigPath, outDir) {
  'use strict';

  var relPath = path.relative(__dirname, process.cwd());
  var config = require(path.join(relPath, tsConfigPath));
  var compilerOpts = config.compilerOptions || {};
  var project = projects[tsConfigPath];
  if (! project) {
    project = projects[tsConfigPath] = ts.createProject(_.extend({
      noExternalResolve: false,
      sortOutput: true,
      typescript: typescript
    }, compilerOpts));
  }

  // Get entry points from config files
  var files = config.files || [];
  if (production.isSet()) {
    files = files.concat(config.prodFiles || []);
  } else {
    files = files.concat(config.devFiles || []);
  }

  // Files are relative to tsconfig.json file. Adjust paths so they're
  // relative to cwd
  var base = path.dirname(tsConfigPath);
  files = _.map(files, function(f) {
    f = path.join(base, f);
    return path.relative(process.cwd(), f);
  });

  // Concatenate entry points to globs to ensure more consistent ordering
  globs = files.concat(globs);
  var ret = gulp.src(globs, { base: "." });

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

  if (config.production) {
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

  return ret.pipe(gulp.dest(outDir));
}
