'use strict';
/* Configuration options for Stoat build, used by Gulpfile */

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Root dir for published extension
  pubDir: "pub",

  // TypeScript projects -- one per concatened JS bundle to emit
  tsProjects: [
    { // Project for testing Marten modules

      // Compiler options -- see https://github.com/ivogabe/gulp-typescript
      // and https://github.com/Microsoft/TypeScript/wiki/Compiler-Options
      compilerOptions: {
        noImplicitAny: false,
        jsx: "react"
      },

      /*
        Files to include generally speaking. These globs should be over-
        inclusive. You can use the devIn and prodIn params to designate entry
        points that limit which files are included. Use references within TS
        files to sorting for concatenation.

        Be sure to reference Marten's TS files as well -- Gulp will not look
        outside these globs for files.
      */
      globs: ["marten/typings/**/*.d.ts", "marten/ts/**/*.{ts,tsx}",
              "common/*.{ts,tsx}", "content-script/*.{ts,tsx}"],

      // Entry point for dev -- all files must be referenced directly or
      // indirectly from these files to be bundled
      devIn: ["content-script/Main.ts"],

      // Same as devIn, but for production
      prodIn: ["content-script/Main.ts"],

      // Relative path to bundle from pubDir
      out: "js/content-script.js",

      // Preprocess with Oblivion?
      oblivion: true
    }
  ],

  // Path to oblivion executable for pre-processing TS files. Oblivion is not
  // provided via Gulp or NPM, and we assume Oblivion has been correctly
  // setup already via the Makefile
  oblivionPath: "marten/setup/bin/oblivion",

  // Directory with LESS files
  lessDir: "css",

  // Where to write our LESS files
  lessOutDir: "css",

  // Where to find simple our html pages
  htmlDir: "html",

  // A Browserify entry point for bundling together our third-party
  // vendor JS files
  vendorJSIndex: "vendor.js",

  // Where Browserify should write the JS bundle (relative to pubDir)
  vendorJSOut: "js/vendor.js",

  // Vendor CSS files to concatenate and minimize, relative to the vendor
  // directory set in Marten's .bowerrc
  vendorCSSList: [
    "font-awesome/css/font-awesome.css",
    "animate.css/animate.css"
  ],

  // Path to CSS bundle (relative to pubDir)
  vendorCSSOut: "css/vendor.css",

  // Vendor assets to copy without any transformation -- map from
  // from glob relative to vendor dir to destination directory
  vendorAssets: {
    "bootstrap/fonts/*.*": "fonts",
    "font-awesome/fonts/*.*": "fonts"
  },

  // Production mode => no sourcemaps + uglify -- doesn't have to be set
  // here, can be done programatically with Gulp task
  production: false,

  // Where to provision test runner in pubDir
  testDir: "test"
};
