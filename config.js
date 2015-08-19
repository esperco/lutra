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

  // Entry points for LESS compilation. Use improts to bundle any other
  // LESS files you want
  lessEntryPoints: [],

  // Port for live reload server to use. 35729 is the default for most
  // LiveReload browser extensions
  liveReloadPort: 35729,

  // Live server port
  serverPort: 5000
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
    "ts/dev.ts",
  ]
}));
