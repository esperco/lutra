/*
  Utilities for dealing with timezones.
*/

var timezone = (function() {
  var mod = {};

  /*
    Mapping from main US timezones to their common name.

    Note that there are a lot of other timezones in the United States
    affecting parts or the totality of certain states.
   */
  var mapping = {
    "America/Chicago": "US Central Time",
    "America/Denver": "US Mountain Time",
    "America/Los_Angeles": "US Pacific Time",
    "America/New_York": "US Eastern Time"
  };

  function pad(n) {
    var s = "" + n;
    var len = s.length;
    if (len === 0)
      s = "00";
    else if (len === 1)
      s = "0" + s;
    return s;
  }

  mod.getOffsetString = function(tz, localdate) {
    var d = date.utcOfLocal(tz, localdate);
    var offsetMinutes =
      Math.floor((localdate.getTime() - d.getTime()) / 1000 / 60);
    var sign = offsetMinutes < 0 ? "-" : "+";

    offsetMinutes = Math.abs(offsetMinutes);
    var m = offsetMinutes % 60;
    var h = Math.floor(offsetMinutes / 60);
    return "GMT" + sign + pad(h) + ":" + pad(m);
  };

  /*
    Take a IANA timezone and convert it into a string that is more
    user-friendly:
    "America/Los_Angeles" -> "US Pacific Time (America/Los_Angeles)"
  */
  mod.format = function(tz, optLocaldate) {
    var name = mapping[tz];
    var offs = "";

    if (util.isDefined(name)) {
      if (util.isDefined(optLocaldate))
        offs = ", " + mod.getOffsetString(tz, optLocaldate);
      name = name + " (" + tz + offs + ")";
    }
    else {
      if (util.isDefined(optLocaldate))
        offs = " (" + mod.getOffsetString(tz, optLocaldate) + ")";
      name = tz + offs;
    }
    return name;
  };

  /*
    This returns the browser's timezone in standard IANA format
    (e.g. "America/Los_Angeles").
   */
  mod.guessUserTimezone = function() {
    var tz = jstz.determine();
    return tz.name();
  };

  return mod;
})();
