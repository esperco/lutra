"use strict";

// For helpers we should use the gulp module installed by the requesting
// package, not our own. Should be required with a referene to correct
// gulp module
module.exports = function(gulp) {
  return {
    less: require("./less")(gulp),
    server: require("./server")(gulp),
    tsc: require("./tsc")(gulp),
    vendor: require("./vendor")(gulp)
  };
};
