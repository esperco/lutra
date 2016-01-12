"use strict";

// For helpers used by gulpfile
module.exports = {
  assets: require("./assets"),
  bundle: require("./bundle"),
  clean: require("./clean"),
  html: require("./html"),
  jasmine: require("./jasmine"),
  js: require("./js"),
  less: require("./less"),
  server: require("./server"),
  setProduction: require("./production").set,
  typescript: require("./typescript"),
  watch: require("./watch")
};
