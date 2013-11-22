var variant = (function() {
  var mod = {};

  mod.cons = function(x) {
    if (util.isString(x))
      return x;
    else
      return x[0];
  }

  return mod;
}());
