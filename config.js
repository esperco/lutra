'use strict';
/* Configuration options for Stoat build, used by Gulpfile */

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Root dir for published extension
  pubDir: "pub",

  // TypeScript projects -- one per concatened JS bundle to emit
  tsProjects: [

    // CONTENT SCRIPT /////////////////////////////////////////////

    { // Project for content-script (which injects gcal-is and gmail-is)

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
    },


    // EVENT PAGE /////////////////////////////////////////////

    { // Project for event-page (which sits in the background and waits for
      // event calls -- see above for comments re items below

      compilerOptions: {
        noImplicitAny: false,
        jsx: "react"
      },

      globs: ["marten/typings/**/*.d.ts", "marten/ts/**/*.{ts,tsx}",
              "common/*.{ts,tsx}", "event-page/*.{ts,tsx}"],

      // Entry point for dev -- all files must be referenced directly or
      // indirectly from these files to be bundled
      devIn: ["event-page/Main.ts"],

      // Same as devIn, but for production
      prodIn: ["event-page/Main.ts"],

      // Relative path to bundle from pubDir
      out: "js/event-page.js",

      // Preprocess with Oblivion?
      oblivion: true
    },


    // GCAL-IS /////////////////////////////////////////////

    { // Project for script injected into Google Calendar page

      compilerOptions: {
        noImplicitAny: false,
        jsx: "react"
      },

      globs: ["marten/typings/**/*.d.ts", "marten/ts/**/*.{ts,tsx}",
              "common/*.{ts,tsx}", "gcal-is/*.{ts,tsx}"],

      // Entry point for dev -- all files must be referenced directly or
      // indirectly from these files to be bundled
      devIn: ["gcal-is/Main.ts"],

      // Same as devIn, but for production
      prodIn: ["gcal-is/Main.ts"],

      // Relative path to bundle from pubDir
      out: "js/gcal-is.js",

      // Preprocess with Oblivion?
      oblivion: true
    },


    // GMAIL-IS /////////////////////////////////////////////

    { // Project for script injected into Gmail page

      compilerOptions: {
        noImplicitAny: false,
        jsx: "react"
      },

      globs: ["marten/typings/**/*.d.ts", "marten/ts/**/*.{ts,tsx}",
              "common/*.{ts,tsx}", "gmail-is/*.{ts,tsx}"],

      // Entry point for dev -- all files must be referenced directly or
      // indirectly from these files to be bundled
      devIn: ["gmail-is/Main.ts"],

      // Same as devIn, but for production
      prodIn: ["gmail-is/Main.ts"],

      // Relative path to bundle from pubDir
      out: "js/gmail-is.js",

      // Preprocess with Oblivion?
      oblivion: true
    },

    // OPTIONS-PAGE //////////////

    { // Project for the options page saving script

      compilerOptions: {
        noImplicitAny: true,
        jsx: "react"
      },

      globs: ["marten/typings/**/*.d.ts", "marten/ts/**/*.{ts,tsx}",
              "common/*.{ts,tsx}", "options-page/*.{ts,tsx}"],

      // Entry point for dev -- all files must be referenced directly or
      // indirectly from these files to be bundled
      devIn: ["options-page/Main.ts"],

      // Same as devIn, but for production
      prodIn: ["options-page/Main.ts"],

      // Relative path to bundle from pubDir
      out: "js/options.js",

      // Preprocess with Oblivion?
      oblivion: false
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
  htmlDirs: ["options-page"],

  // A Browserify entry point for bundling together our third-party
  // vendor JS files
  vendorJSIndex: "vendor.js",

  // Where Browserify should write the JS bundle (relative to pubDir)
  vendorJSOut: "js/vendor.js",

  // Vendor CSS files to concatenate and minimize, relative to the vendor
  // directory set in Marten's .bowerrc
  vendorCSSList: [
    // NB: Intentionally left blank -- CSS files are namespaced and imported
    // via LESS files
  ],

  // Path to CSS bundle (relative to pubDir)
  vendorCSSOut: "css/vendor.css",

  // Vendor assets to copy without any transformation -- map from
  // from glob relative to vendor dir to destination directory
  vendorAssets: {
    "bootstrap/fonts/*.*": "fonts",
    "font-awesome/fonts/*.*": "fonts",
    "analytics/analytics.js": "js"
  },

  // Production mode => no sourcemaps + uglify -- doesn't have to be set
  // here, can be done programatically with Gulp task
  production: false,

  // Where to provision test runner in pubDir
  testDir: "test"
};
