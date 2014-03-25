var calcache = (function() {
  var mod = {};

  /* Round down to Saturday 00:00 am */
  function roundBeginningOfWeek(d) {
    var dayOfWeek = d.getUTCDay(); /* 0-6 */
    var unixtime = d.getTime() / 1000;
    unixtime = unixtime - unixtime % 86400;
    if (dayOfWeek < 6)
      unixtime = unixtime - (dayOfWeek + 1) * 86400;
    return new Date(1000 * unixtime);
  }

  /* Round up to Tuesday 00:00 am */
  function roundEndOfWeek(d) {
    var dayOfWeek = d.getUTCDay(); /* 0-6 */
    var unixtime = d.getTime() / 1000;
    unixtime = unixtime - unixtime % 86400;
    if (dayOfWeek < 2)
      unixtime = unixtime + (2 - dayOfWeek) * 86400;
    else
      unixtime = unixtime + (9 - dayOfWeek) * 86400;
    return new Date(1000 * unixtime);
  }

  function getDateOnly(d) {
    var s = ""
      + d.getUTCFullYear() + "-"
      + d.getUTCMonth() + "-"
      + d.getUTCDate();
    return s;
  }

  /*
    Extend week boundaries to accomodate all time zones.
    This produces the key used in the cache.
  */
  function getRoundRange(localStart, localEnd) {
    var start = roundBeginningOfWeek(localStart);
    var end = roundEndOfWeek(localEnd);
    var key = getDateOnly(localStart) + "-" + getDateOnly(localEnd);
    return {
      start: start,
      end: end,
      key: key
    };
  }

  function clear(cache) {
    for (var k in cache)
      delete cache[k];
  }

  /* Get from the cache only; no refresh takes place */
  function get(cache, start, end, tz) {
    var range = getRoundRange(start, end);
    var k = range.key;
    var v = cache[k];
    if (util.isDefined(v))
      return v;
    else
      return null;
  }

  function refresh(cache, start, end, tz) {
    var range = getRoundRange(start, end);
    api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: range.start,
      window_end: range.end
    })
      .then(function(apiResult) {
        var events = apiResult.events;
        cache[range.key] = events;
        return events;
      });
  }

  /*
    Return the requested calendar page asynchronously.

    If a cached value is available, it is returned immediately
    but the refresh call is performed anyway and the whenRefreshed
    function is called when the refresh call succeeds.
  */
  function fetch(cache, start, end, tz, whenRefreshed) {
    var k = makeKey(start, end, tz);
    var v = cache[k];
    function fetchAhead() {
      refresh(cache, oneWeekEarlier(start), start, tz);
      refresh(cache, end, oneWeekLater(end), tz);
    }
    if (util.isDefined(v)) {
      refresh(cache, start, end, tz)
        .then(whenRefreshed);
      fetchAhead();
      return deferred.defer(v);
    }
    else {
      var result = refresh(cache, start, end, tz);
      fetchAhead();
      return result;
    }
  }

  mod.create = function() {
    var cache = {};
    return {
      get: function(start, end, tz) {
        return get(cache, start, end, tz);
      },
      fetch: function(start, end, tz) {
        return fetch(cache, start, end, tz);
      },
      replace: function(start, end, tz, v) {
        return replace(cache, start, end, tz, v);
      },
      clear: function() {
        clear(cache);
      }
    };
  }

  return mod;
})();
