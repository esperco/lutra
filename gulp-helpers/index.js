"use strict";

// For helpers we should use the gulp module installed by the requesting
// package, not our own. Should be required with a referene to correct
// gulp module
module.exports = {
  assets: require("./assets"),
  clean: require("./clean"),
  html: require("./html"),
  js: require("./js"),
  less: require("./less"),
  server: require("./server"),
  test: require("./test"),
  typescript: require("./typescript"),
  vendor: require("./vendor"),
  watch: require("./watch")
};
