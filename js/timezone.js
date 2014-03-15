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

  /*
    Take a IANA timezone and convert it into a string that is more
    user-friendly:
    "America/Los_Angeles" -> "US Pacific Time (America/Los_Angeles)"
  */
  mod.format = function(tz) {
    var name = mapping[tz];
    if (util.isDefined(name))
      name = name + " (" + tz + ")";
    else
      name = tz;
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
