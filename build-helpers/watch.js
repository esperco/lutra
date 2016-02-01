"use strict";
var _ = require("lodash");

/*
  Short-hand for returning a function that creates a watcher based on an
  existing task. Function requires reference to exact gulp isntance in order to
  avoid "Task never defined" errors.

  gulp - Reference to gulp module.
*/
function makeWatch(gulp) {

  /*
    globs: string[] - Globs to watch
    task: string|function - Name of Gulp task, or task itself
  */
  return function(globs, task) {
    return function() {
      // Set a var on this function so other code knows we're in watch mode
      makeWatch.watchMode = true;

      if (! _.isFunction(task)) {
        task = gulp.series(task);
      }

      return gulp.watch(globs, task);
    };
  };
};

module.exports = makeWatch;
