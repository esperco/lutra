'use strict';

/* Configuration options for Gulp and other NodeJS-based build processes
   These settings are used primarily for developing Marten or unit-testing
   its individual components. You should use a separate broad process that
   imports in the raw Marten assets for things that rely on it.

   NB: TypeScript options can also be found in tsconfig.json
*/
var path = require('path');

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Root dir for test site
  pubDir: "pub",

  // Path to TypeScript compiler command
  tscPath: "tsc",

  // TypeScript output directory, relative to pubDir
  tscOutDir: "js",

  // Directory with LESS files
  lessDir: "less",

  // Where to write our LESS files
  lessOutDir: "css",

  // Where to find simple our html pages
  htmlDir: "html",

  // A Browserify entry point for bundling together our third-party
  // vendor JS files
  vendorJSIndex: "vendor/index.js",

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

  // Global variable name used by TS files to determine production mode
  // We use a pretty dumb regex to find this variable and replace it with
  // "true" in production, so make sure it's unique and not likely to appear
  // outside of this use-case
  productionVar: "__PRODUCTION__"
};

// Write tsconfig.json data -- we write from config.json instead of writing
// directly ourselves so we can reference config data above (and add comments)
var fs = require('fs');
fs.writeFileSync("./tsconfig.json", JSON.stringify({
  compilerOptions: {
    noImplicitAny: true,
    // removeComments: true,
    outDir: path.join(module.exports.pubDir, module.exports.tscOutDir)
  },

  // Used by Atom TypeScript and certain IDEs
  compileOnSave: false,

  // This should function as a list of entry-points (use references to
  // include files that should be concatenated within)
  files: [
    "ts/app.ts",
  ]
}));
