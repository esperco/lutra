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
        var offset = match.offset;
        var length = match.length;
        if (i == offset + length) {
          withBold += "</b>";
        }
        if (i == 0 && offset == 0) {
          withBold += "<b>";
        } else if (i == offset - 1) {
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
