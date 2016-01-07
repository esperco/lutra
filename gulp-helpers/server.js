"use strict";
var ecstatic = require("ecstatic"),
    gulp = require("gulp"),
    livereload = require("livereload"),
    http = require("http"),
    path = require("path");

/*
  Launches a development server for files in pub dir.

  root: string - Path to serve from (pub dir)
  cb: () => any - Callback for when server is ready
  opts.port: number = 5000 - Port to listen on
  opts.liveReloadPort: number = 35729 - Port to listen on for live reload.
    Port 35729 is default for LiveReload browser extensions.
*/
module.exports = function(root, cb, opts) {
  opts = opts || {};
  var port = opts.port || 5000;
  http.createServer(
    ecstatic({ root: path.resolve(root),
               contentType: 'text/html' })
  ).listen(port);
  console.log("Server listening at http://localhost:" + port);

  liveReload(root, opts.liveReloadPort || 35729);
  cb();
};

/*
  Live reload server (called from main export function)

  root: string - Path to pub dir
  port: number - Port to listen on
*/
function liveReload(root, port) {
  var server = livereload.createServer({
    port: port
  });
  server.watch(root);
}
