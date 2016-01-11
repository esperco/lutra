"use strict";

// For helpers used by gulpfile
module.exports = {
  assets: require("./assets"),
  clean: require("./clean"),
  html: require("./html"),
  js: require("./js"),
  less: require("./less"),
  server: require("./server"),
  setProduction: require("./production").set,
  test: require("./test"),
  typescript: require("./typescript"),
  vendor: require("./vendor"),
  watch: require("./watch")
};
