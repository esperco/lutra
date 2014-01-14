/*
  Error/success messages displayed to the user in the status area.

  This module is called 'status_' rather than 'status' because
  Chrome uses a global variable of that name (window.status)
  and we cannot override it.
*/

var status_ = (function() {
  var mod = {};

  mod.report = function(msg, kind) {
    var elt = $("#global-status");
    elt.children().remove();
    elt
      .text(msg)
      .addClass("alert alert-" + kind)
      .removeClass("hide")
      .click(function() {
        elt.addClass("hide");
      });
    elt.append($("<a class='close'>×</a>"));
  };

  mod.reportError = function(msg) {
    mod.report(msg, "danger");
  };

  mod.reportSuccess = function(msg) {
    mod.report(msg, "success");
  };

  mod.clear = function() {
    $("#error").addClass("hide");
  };

  /*
    Suitable error handler for http responses passed as
    the second argument of .then()

    If not specified, the error message displayed is the response body.
  */
  mod.onError = function(statusCode, optMsg) {
    return function(jqXHR, textStatus, errorThrown) {
      if (statusCode === jqXHR.status) {
        var msg = util.isString(optMsg) ? optMsg : jqXHR.responseText;
        mod.reportError(msg);
      }
    };
  };

  /* Any click in the browser's window hides the status area */
  mod.init = function() {
    $("body").click(function() {
      $("#global-status").addClass("hide");
      return true;
    });
  };

  return mod;
}());
