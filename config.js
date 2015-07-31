// Configuration options for Gulp and other NodeJS-based build processes

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Location of this file relative to the base dir for Otter
  projectBase: ".",

  // Path to oblivion executable for pre-processing TS files. Oblivion is not
  // provided via Gulp or NPM, and we assume Oblivion has been correctly
  // setup already via the Makefile
  oblivionPath: "setup/bin/oblivion",

  // Path to TypeScript compiler command
  tscPath: "tsc",

  // Glob patterns for finding all TS files to build / watch
  tsGlobs: [ "setup/ts/*.d.ts", "ts/*.ts" ],

  // A TS file that references all other TS files -- use this file to control
  // the order in which files are concatenated or referenced
  tsEntryPoint: "ts/Aardvark.ts",

  // Bundle TS into this file in pubDir
  tsBundleName: "js/app.js",

  // Distributable HTML, JS, etc.
  pubDir: "pub",

  // Port for live reload server to use. 35729 is the default for most
  // LiveReload browser extensions
  liveReloadPort: 35729, 

  // Production mode? => this can be set to true within the gulpfile itself
  // by calling the "production" task
  production: false
};