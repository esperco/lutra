// Configuration options for Gulp and other NodeJS-based build processes

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Path to oblivion executable for pre-processing TS files. Oblivion is not
  // provided via Gulp or NPM, and we assume Oblivion has been correctly
  // setup already via the Makefile
  oblivionPath: "./bin/oblivion",

  // Glob patterns for finding all TS files to build / watch
  tsGlobs: [  "ts/*.d.ts",          // Definitions always come first

              // Aardvark controls the order of our other modules, so make
              // sure this goes first
              "../ts/Aardvark.ts",

              "../ts/*.ts" ],

  // Bundle TS into this file in pubDir
  tsBundleName: "js/app.js",

  // Distributable HTML, JS, etc.
  pubDir: "../pub",

  // Production mode? => this can be set to true within the gulpfile itself
  // by calling the "production" task
  production: false
};