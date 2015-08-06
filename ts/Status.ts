/*
  Error/success messages displayed to the user in the status area.

  This module is called 'status_' rather than 'status' because
  Chrome uses a global variable of that name (window.status)
  and we cannot override it.
*/

module Status {

  export function report(msg, kind) {
    var elt = $("#global-status");
    elt.children().remove();
    elt
      .text(msg)
      .addClass("alert alert-" + kind)
      .show()
      .one("click", function() {
        elt.hide();
      });

    /*
      Leave the error message on for a long time when developing
      so we have time to take a screenshot and whatnot.
    */
    var hideAfterMs = Conf.prod ? 6000 : 300000;

    setTimeout(function() {
      elt.hide();
    }, hideAfterMs);
  };

  export function reportError(msg) {
    report(msg, "danger");
  };

  export function reportSuccess(msg) {
    report(msg, "success");
  };

  export function clear() {
    $("#error").hide();
  };

  /*
    Suitable error handler for http responses passed as
    the second argument of .then()

    If not specified, the error message displayed is the response body.
  */
  export function onError(statusCode, optMsg) {
    return function(jqXHR, textStatus, errorThrown) {
      if (statusCode === jqXHR.status) {
        var msg = Util.isString(optMsg) ? optMsg : jqXHR.responseText;
        reportError(msg);
      }
    };
  };

  export function onErrors(statusCodes, optMsg) {
    return function(jqXHR, textStatus, errorThrown) {
      if (statusCodes.indexOf(jqXHR.status) != -1) {
        var msg = Util.isString(optMsg) ? optMsg : jqXHR.responseText;
        reportError(msg);
      }
    };
  };

  /* Any click in the browser's window hides the status area */
  export function init() {
    $("body").click(function() {
      $("#global-status").hide();
      return true;
    });
  };

}
