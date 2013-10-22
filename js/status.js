/*
  Error/success messages displayed to the user.
*/

var status = (function() {
  var mod = {};

  mod.report = function(msg, kind, details) {
    $("#status")
      .text(msg)
      .addClass("alert alert-" + kind)
      .removeClass("hide")
      .delay(2000)
      .slideUp(1000);
    log({
      status: msg,
      kind: kind,
      details: details
    });
  }

  // error status
  mod.reportError = function(msg, details) {
    mod.report(msg, "error", details);
  }

  mod.reportSuccess = function(msg) {
    mod.report(msg, "success", {});
  }

  mod.clear = function() {
    $("#error").addClass("hide");
  }

  return mod;
}());
