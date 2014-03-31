/*
  Animated Esper logo that indicates we're waiting for an API call to finish
*/

var spinner = (function() {
  var mod = {};

  mod.start = function(msg) {
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

  /* Spin the spinner while the asynchronous call isn't over. */
  mod.spin = function(msg, deferredValue) {
    /* Don't start the spinner if the result is already available */
    if (deferredValue.state() === "pending") {
      mod.start(msg);
      deferredValue
        .always(mod.stop);
    }
    return deferredValue;
  };

  return mod;
}());
