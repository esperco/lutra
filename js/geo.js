/*
  Geocoding utilities
*/

var geo = (function() {
  var mod = {};

  /* Boy does this function suck. Hooray for imperative programming!
   * If you can think of a better way to write this, be my guest! */
  mod.highlight = function (address, matches) {
    var withBold = "";
    for (var i = 0; i < address.length; i++) {
      var c = address[i];
      var wroteChar = false;
      for (var j = 0; j < matches.length; j++) {
        if (i == matches[j][0] + matches[j][1]) {
          withBold += "</b>";
        }
        if (i == 0 && matches[j][0] == 0) {
          withBold += "<b>";
        } else if (i == matches[j][0] - 1) {
          withBold += address.charAt(i) + "<b>";
          wroteChar = true;
        }
      }
      if (!wroteChar) { withBold += address.charAt(i); }
    }
    return withBold;
  };

  mod.load = function() { };

  return mod;
}());
