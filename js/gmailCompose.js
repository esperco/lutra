/*
  Open a Gmail composition window
*/

var gmailCompose = (function() {
  var mod = {};

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
    window.open(url, "_blank"); /* a nasty pop up */
  };

  return mod;
})();
