/*
  Manage the time-only format hh:mm:ss used for calendar events.
  (compatible with RFC 3339)

  Fractional seconds are accepted in the input but seconds are rounded
  to the nearest integer.
*/

var timeonly = (function() {
  var mod = {};

  function pad(x) {
    var s = x.toString();
    if (s.length == 1)
      return "0" + s;
    else if (s.length == 0)
      return "00";
    else
      return s;
  }

  /* round to the nearest integer */
  function round(x) {
    return Math.floor(x + 0.5);
  }

  mod.ofSeconds = function(s) {
    var s = round(s) % 86400;
    var h = Math.floor(s/3600);
    s = s % 3600;
    var m = Math.floor(s/60);
    s = s % 60;
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  };

  mod.ofMinutes = function(m, s) {
    var s = s > 0 ? s : 0;
    return mod.ofSeconds(60 * m + s);
  };

  mod.ofHours = function(h, m, s) {
    var m = m > 0 ? m : 0;
    var s = s > 0 ? s : 0;
    return mod.ofSeconds(3600 * h + 60 * m + s);
  };

  var regexp = /([0-9]+):([0-9]+):([0-9]+(\.[0-9]*)?)/;

  mod.toSeconds = function(s) {
    var x = regexp.exec(s);
    var h = parseInt(x[1], 10);
    var m = parseInt(x[2], 10);
    var s = round(parseFloat(x[3]));
    return 3600 * h + 60 * m + s;
  };

  mod.tests = [
    test.expect(null, mod.toSeconds, "23:59:59.1", 86399),
    test.expect(null, mod.toSeconds, "23:59:59.508", 86400),
    test.expect(null, mod.ofSeconds, 86399.51, "00:00:00"),
    test.expect(null, mod.ofSeconds, 86399.49, "23:59:59"),
  ];

  return mod;
}());
