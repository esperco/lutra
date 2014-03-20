/*
  Animated Esper logo that indicates we're waiting for an API call to finish
*/

var spinner = (function() {
  var mod = {};

  mod.spin = function(msg) {
    if (util.isNotNull(msg)) {
      $("#loading-text").text(msg);
    } else {
      $("#loading-text").text("Loading...");
    }
    $("#loading").show();
  };

  mod.stop = function() {
    $("#loading").hide();
  };

  return mod;
}());
