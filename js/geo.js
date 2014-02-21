/*
  Geocoding utilities
*/

var geo = (function() {
  var mod = {};

  mod.highlight = function (address, matches) {
    var withBold = "";
    var esc = util.htmlEscape;
    for (var i = 0; i < address.length; i++) {
      var c = address[i];
      var wroteChar = false;
      for (var j = 0; j < matches.length; j++) {
        var match = matches[j];
        if (i == match[0] + match[1]) {
          withBold += "</b>";
        }
        if (i == 0 && match[0] == 0) {
          withBold += "<b>";
        } else if (i == match[0] - 1) {
          withBold += esc(address.charAt(i)) + "<b>";
          wroteChar = true;
        }
      }
      if (!wroteChar) { withBold += esc(address.charAt(i)); }
    }
    return withBold;
  };

  mod.load = function() { };

  return mod;
}());
