var _ = require("lodash"),
    path = require("path");

/*
  Returns the base paths for a series of glob patterns

  globs: string[] - A list of globs
*/
module.exports = function(globs) {
  return _.uniq(_.map(globs, function(g) {
    var parts = g.split(path.sep);
    var i = _.findIndex(parts, function(p) {
      return p[0] === '*';
    });
    return parts.slice(0, i).join(path.sep);
  }));
}
