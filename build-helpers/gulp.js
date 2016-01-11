"use strict";

// For helpers used by gulpfile
module.exports = {
  assets: require("./assets"),
  bundle: require("./bundle"),
  clean: require("./clean"),
  html: require("./html"),
  js: require("./js"),
  less: require("./less"),
  server: require("./server"),
  setProduction: require("./production").set,
  test: require("./test"),
  typescript: require("./typescript"),
  watch: require("./watch")
};
