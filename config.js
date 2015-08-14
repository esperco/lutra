// Configuration options for Gulp and other NodeJS-based build processes

// Paths should be relate to config file unless otherwise specified
module.exports = {

  // Distributable HTML, JS, etc.
  pubDir: "pub",

  // Asset locations
  htmlDir: "html",
  lessDir: "css",
  cssDir: "css",
  jsDir: "js",
  imgDir: "img",

  // Port for live reload server to use. 35729 is the default for most
  // LiveReload browser extensions
  liveReloadPort: 35729, 

  // Live server port
  serverPort: 5000
};