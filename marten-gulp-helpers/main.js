"use strict";

// For helpers we should use the gulp module installed by the requesting
// package, not our own. Should be required with a referene to correct
// gulp module
module.exports = function(gulp) {
  return {
    clean: require("./clean")(gulp),
    html: require("./html")(gulp),
    less: require("./less")(gulp),
    server: require("./server")(gulp),
    test: require("./test")(gulp),
    tsc: require("./tsc")(gulp),
    vendor: require("./vendor")(gulp)
  };
};
