"use strict";
/* Use to create tasks for cleaning out the pubDir for Gulp v4 */

var del = require("del");

/*
  Deletes a pub dir

  pubDir: string - Pub directory to clean
  cb: () => any - Callback for when task is complete
*/
module.exports = function(pubDir, cb) {
  del(pubDir, cb);
};
