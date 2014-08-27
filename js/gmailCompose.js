/*
  Open a Gmail composition window
*/

var gmailCompose = (function() {
  var mod = {};

  function popWindow(url, width, height) {
    /* Allow for borders. */
    var leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
    /* Allow for title and status bars. */
    var topPosition = (window.screen.height / 2) - ((height / 2) + 50);

    window.open(
      url, "Window2", "status=no,height="
        + height + ",width=" + width + ",resizable=yes,left="
        + leftPosition + ",top=" + topPosition + ",screenX="
        + leftPosition + ",screenY=" + topPosition
        + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no");
  }

  function makeUrl(param) {
    var url = "https://mail.google.com/mail?view=cm&cs=wh&tf=0";
    if (util.isString(param.to))
      url += "&to=" + encodeURIComponent(param.to);
    if (util.isString(param.subject))
      url += "&su=" + encodeURIComponent(param.subject);
    if (util.isString(param.body))
      url += "&body=" + encodeURIComponent(param.body);
    return url;
  };

  mod.compose = function(param) {
    var url = makeUrl(param);
    popWindow(url, 1000, 600);
  };

  return mod;
})();
