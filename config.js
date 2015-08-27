'use strict';

/* Configuration options for Gulp and other NodeJS-based build processes
   These settings are used primarily for developing Marten or unit-testing
   its individual components. You should use a separate broad process that
   imports in the raw Marten assets for things that rely on it.

   NB: TypeScript options can also be found in tsconfig.json
*/

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Root dir for test site
  pubDir: "pub",

  // TypeScript projects -- one per concatened JS bundle to emit
  tsProjects: [
    { // Project for testing Marten modules

      // Compiler options -- see https://github.com/ivogabe/gulp-typescript
      // and https://github.com/Microsoft/TypeScript/wiki/Compiler-Options
      compilerOptions: {
        noImplicitAny: true,
        jsx: "react"
      },

      /*
        Files to include generally speaking -- you can exclude for specific
        environments using tsDevGlobs and tsProdGlobs. Order shouldn't matter
        if you use references within TS files to sort.

        For projects outside of Marten, be sure to reference Marten's TS files
        as well -- Gulp will not look outside these globs for files.
      */
      globs: ["typings/**/*.d.ts", "ts/**/*.ts", "ts/**/*.tsx"],

      // Files to include for dev, prefix with "!" to exclude files
      devGlobs: ["!ts/Prod.ts"],

      // Files to include for prod, prefix with "!" to exclude files
      prodGlobs: ["!ts/Dev.ts", "!ts/Test.ts",
                  "!ts/**/*.Test.ts", "!ts/**/*.Test.tsx"],

      // Relative path to bundle from pubDir
      out: "js/app.js"
    }
  ],

  // Directory with LESS files
  lessDir: "less",

  // Where to write our LESS files
  lessOutDir: "css",

  // Where to find simple our html pages
  htmlDir: "html",

  // A Browserify entry point for bundling together our third-party
  // vendor JS files
  vendorJSIndex: "js/vendor.js",

  // Where Browserify should write the JS bundle (relative to pubDir)
  vendorJSOut: "js/vendor.js",

  // Vendor CSS files to concatenate and minimize, relative to the vendor
  // directory set in .bowerrc
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

  // Port for live reload server to use. 35729 is the default for most
  // LiveReload browser extensions
  liveReloadPort: 35729,

  // Live server port
  serverPort: 5000,

  // Production mode => no sourcemaps + uglify -- doesn't have to be set
  // here, can be done programatically with Gulp task
  production: false,

  // Where to provision test runner in pubDir
  testDir: "test"
};
