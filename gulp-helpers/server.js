"use strict";

// Use to setup a live reload server for Gulp v4
module.exports = function(gulp) {
  var ecstatic = require("ecstatic"),
      livereload = require("livereload"),
      http = require("http"),
      path = require("path");

  var exports = {};

  exports.httpServer = function(name, config) {
    name = name || "http-server";
    return gulp.task(name, function(cb) {
      http.createServer(
        ecstatic({ root: path.resolve(config.pubDir),
                   contentType: 'text/html' })
      ).listen(config.serverPort);
      console.log("Server listening at http://localhost:" + config.serverPort);
      cb();
    });
  };

  exports.liveReload = function(name, config) {
    name = name || "live-reload";
    return gulp.task(name, function(cb) {
      var server = livereload.createServer({
        port: config.liveReloadPort
      });
      server.watch(config.pubDir);
      cb();
    });
  };

  return exports;
};