"use strict";
/* Use to create tasks for cleaning out the pubDir for Gulp v4 */

module.exports = function(gulp) {
  var del = require("del");

  var exports = {};

  /* Wipe out pubDir */
  exports.clean = function(name, config) {
    name = name || "clean";
    return gulp.task(name, function(cb) {
      del(config.pubDir, cb);
    });
  };

  return exports;
};


