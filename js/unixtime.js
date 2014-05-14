var unixtime = (function() {
  var mod = {};

  mod.now = function() {
    return (new Date()).getTime() / 1000;
  };

  return mod;
}());
