var html = (function() {
  var mod = {};

  /* don't know why jQuery doesn't provide an 'appendText' method */
  mod.text = function(s) { return document.createTextNode(s); };

  return mod;
}());
