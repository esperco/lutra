/*
  Error/success messages displayed to the user in the status area.

  This module is called 'status_' rather than 'status' because
  Chrome uses a global variable of that name (window.status)
  and we cannot override it.
*/

module Status {

  export function report(msg, kind) {
<<<<<<< Updated upstream
    var elt = $("#global-status");
    elt.children().remove();
    elt
      .text(msg)
      .addClass("alert alert-" + kind)
      .show()
      .one("click", function() {
        elt.hide();
      });
    setTimeout(function() {
      elt.hide();
    }, 3000);
=======
    var container = $("#global-status");

    // Relies on bootstrap for event handling
    var closeButton = $(
      `<button type="button" class="close" data-dismiss="alert"
               aria-label="Close">
          <span aria-hidden="true">&times;</span>
      </button>`);

    var elt = $(`<div />`)
      .append(closeButton)
      .append(msg)
      .addClass("alert alert-dismissible alert-" + kind)

    container.empty().append(elt);

    /*
      Leave the error message on for a long time when developing
      so we have time to take a screenshot and whatnot.
    */
    var hideAfterMs = Conf.prod ? 20000 : 300000;

    setTimeout(function() {
      clear();
    }, hideAfterMs);
>>>>>>> Stashed changes
  };

  export function reportError(msg) {
    report(msg, "danger");
  };

  export function reportSuccess(msg) {
    report(msg, "success");
  };

  export function clear() {
    $("#global-status").empty();
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

  /* Any click in the browser's window hides the status area
     NB: Disabled to allow copying and pasting of errors */
  export function init() {
    // $("body").click(function() {
    //   clear();
    //   return true;
    // });
  };

}
