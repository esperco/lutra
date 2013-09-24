/*
  Cache of user profiles keyed by uid
*/

var users = (function() {
  var mod = {};

  // Global cache
  mod.cache = {};

  mod.get = function(uid) {
    var x = mod.cache[uid];
    return (x ? x : null);
  };

  mod.replace = function(x) {
    mod.cache[x.profile_uid] = x;
  };

  // Sample initialization
  mod.replace(sample.robin);
  mod.replace(sample.joe);

  return mod;
}());
