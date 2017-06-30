"use strict";

// NB: This gulp file is intended to be used with Gulp 4.x and won't
// work with Gulp 3.x or below.
var _ = require("lodash"),
    argv = require('yargs').argv,
    gulp = require("gulp"),
    helpers = require("./build-helpers/gulp"),
    production = require("./build-helpers/production"),
    watch = helpers.watch(gulp);

/* Config vars */
var config = {
  htmlGlobs: ["html/**/*.html"],
  htmlOut: "pub", // HTML goes to root rather than subdir

  assetMap: {
    "img/**/*.*": "pub/img",
    "img/favicon.ico": "pub",
    "./node_modules/font-awesome/fonts/*.*": "pub/fonts"
  },

  jsGlobs: ["js/**/*.js"],
  jsBundles: [
    "bundles/react-page-vendor.js",
    "bundles/timestats-vendor.js"
  ],
  jsOut: "pub/js",

  jasmineDir: "pub/jasmine",

  tsCommonGlobs: [
    "ts/lib/**/*.{ts,tsx}"
  ],
  tsProjects: [
    "ts/manage.js/tsconfig.json",
    "ts/now.js/tsconfig.json",
    // "ts/test.js/tsconfig.json", // Disable -> use ts var to run
    "ts/time.js/tsconfig.json"
  ],

  lessGlobs: [
    "less/**/*.{css,less}",
    "./node_modules/font-awesome/css/font-awesome.css"
  ],
  lessOut: "pub/css",

  pubDir: "pub",

  serverPort: 5001,
  liveReloadPort: 35729
};

// Test-related targets
if (argv.ts && argv.ts === "ts/test.js/tsconfig.json") {
  config.jsBundles.push("bundles/test-vendor.js");
}


/* Gulp tasks */

gulp.task("build-less", function() {
  return helpers.less(config.lessGlobs, config.lessOut);
});

gulp.task("watch-less", watch(config.lessGlobs, "build-less"));

gulp.task("build-jasmine", function() {
  return helpers.jasmine(config.jasmineDir);
});

gulp.task("build-js", function() {
  return helpers.js(config.jsGlobs, config.jsOut);
});

gulp.task("watch-js", watch(config.jsGlobs, "build-js"));

// Focus on one project with the 'ts' flag
var projects = argv.ts ? [argv.ts] : config.tsProjects;
var ts = helpers.typescript(projects,
                            config.tsCommonGlobs,
                            config.jsOut);
gulp.task("build-ts", ts.build);
gulp.task("watch-ts", ts.watch);

gulp.task("build-assets", function() {
  return helpers.assets(config.assetMap);
});

gulp.task("watch-assets", watch(_.keys(config.assetMap), "build-assets"));

gulp.task("build-html", function() {
  let globs = config.htmlGlobs;
  if (production.isSet()) {
    globs = globs.concat(["!html/**/test*"]);
  }
  return helpers.html(globs, config.htmlOut);
});

gulp.task("watch-html", watch(config.htmlGlobs, "build-html"));

gulp.task("build-bundles", function() {
  return helpers.bundle(config.jsBundles, config.jsOut);
});

// NB: Watching Browserify bundles just means passing an extra boolean to
// build step. Gulp's watcher is not required.
gulp.task("watch-bundles", function() {
  return helpers.bundle(config.jsBundles, config.jsOut, true);
});

gulp.task("server", function(cb) {
  return helpers.server(config.pubDir, cb, {
    port: config.serverPort,
    liveReloadPort: config.liveReloadPort
  });
});

/*
  Build tasks that involve revisioning with MD5 hashes before the other stuff
  so that we can replace as appropriate.

  Note that we're currently not MD5-hashing assets, only JS and CSS, since
  our assets don't change that often and additional hashing would require
  that we also update references to those assets within our JS and CSS
  files before hashing those files and replacing those references in HTML.
*/
gulp.task("build", gulp.series(
  gulp.parallel(
    "build-js",
    "build-bundles",
    "build-ts",
    "build-less"
  ),
  gulp.parallel(
    "build-assets",
    "build-jasmine",
    "build-html"
  )
));

gulp.task("clean", function() {
  return helpers.clean(config.pubDir);
});

gulp.task("production", helpers.setProduction);

gulp.task("build-production", gulp.series("production", "clean", "build"));

gulp.task("watch", gulp.series("build",
  gulp.parallel(
    "server",
    "watch-html",
    "watch-assets",
    "watch-js",
    // "watch-bundles", // Skipping since bundling is expensive
                        // If you need to re-bundle, clean and restart.
    "watch-ts",
    "watch-less"
  )
));

gulp.task("default", gulp.series("build"));
