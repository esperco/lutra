module Esper.CalCache {

  interface Range {
    start : Date;
    end : Date;
  }

  interface KeyedRange extends Range {
    key : string;
  }

  interface PrivateCache {
    [key : string] : ApiT.CalendarEvent[];
  }

  /* Round down to Saturday 00:00 am */
  function roundBeginningOfWeek(d : Date) : Date {
    var dayOfWeek = d.getUTCDay(); /* 0-6 */
    var unixtime = d.getTime() / 1000;
    unixtime = unixtime - unixtime % 86400;
    if (dayOfWeek < 6)
      unixtime = unixtime - (dayOfWeek + 1) * 86400;
    return new Date(1000 * unixtime);
  }

  /* Round up to Tuesday 00:00 am */
  function roundEndOfWeek(d : Date) : Date {
    var dayOfWeek = d.getUTCDay(); /* 0-6 */
    var unixtime = d.getTime() / 1000;
    unixtime = unixtime - unixtime % 86400;
    if (dayOfWeek < 2)
      unixtime = unixtime + (2 - dayOfWeek) * 86400;
    else
      unixtime = unixtime + (9 - dayOfWeek) * 86400;
    return new Date(1000 * unixtime);
  }

  /* Round down to 24 hours before beginning of month */
  function roundBeginningOfMonth(d : Date) : Date {
    var withinMonth = new Date(d.getTime() + 86400000);
    var year = withinMonth.getUTCFullYear();
    var month = withinMonth.getUTCMonth();
    return new Date(year, month, 0); /* warning: uses local timezone */
  }

  /* Round down to 24 hours after the end of the month */
  function roundEndOfMonth(d : Date) : Date {
    var withinNextMonth = new Date(d.getTime() + 86400000);
    var year = withinNextMonth.getUTCFullYear();
    var month = withinNextMonth.getUTCMonth();
    return new Date(year, month, 2); /* warning: uses local timezone */
  }

  function getDateOnly(d : Date) : string {
    var s = ""
      + d.getUTCFullYear() + "-"
      + d.getUTCMonth() + "-"
      + d.getUTCDate();
    return s;
  }

  /*
    Extend week boundaries to accomodate all time zones.
    This produces the key used in the cache.

    TODO: make it work for month pages.
          Note that Fullcalendar extends the month
          to the ends of the week, i.e. the narrowest Sun-Sat range that
          includes the whole month, resulting in 4, 5, or 6 whole weeks.
  */
  function getRoundRange(localStart : Date, localEnd : Date) : KeyedRange {
    var start = roundBeginningOfWeek(localStart);
    var end = roundEndOfWeek(localEnd);
    var key = getDateOnly(start) + "-" + getDateOnly(end);
    return {
      start: start,
      end: end,
      key: key
    };
  }

  function previousPage(start : Date, end : Date) : Range {
    var t1 = start.getTime();
    var t2 = end.getTime();
    return {
      start: new Date(t1 - (t2-t1)),
      end: new Date(t1)
    };
  }

  function nextPage(start : Date, end : Date) : Range {
    var t1 = start.getTime();
    var t2 = end.getTime();
    return {
      start: new Date(t2),
      end: new Date(t2 + (t2-t1))
    };
  }

  function clear(cache : PrivateCache) : void {
    for (var k in cache)
      delete cache[k];
  }

  /* Get from the cache only; no refresh takes place */
  function get(cache : PrivateCache, start : Date, end : Date)
    : ApiT.CalendarEvent[]
  {
    var range = getRoundRange(start, end);
    var k = range.key;
    var v = cache[k];
    if (v !== undefined) return v;
    else return null;
  }

  /* Fetch from server, update the cache when the response arrives. */
  function refresh(cache : PrivateCache, teamid : string, calid : string,
                   start : Date, end : Date) 
    : JQueryPromise<ApiT.CalendarEvent[]>
  {
    var range = getRoundRange(start, end);
    var team = List.find(Login.myTeams(), function(team) {
      return team.teamid === teamid;
    });
    return Api.postCalendar(teamid, calid, {
      window_start: range.start.toString(),
      window_end: range.end.toString()
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
  function fetch(cache : PrivateCache, teamid : string, calid : string,
                 start : Date, end : Date,
                 whenRefreshed : (x : ApiT.CalendarEvent[]) =>
                                 JQueryPromise<ApiT.CalendarEvent[]>)
    : JQueryPromise<ApiT.CalendarEvent[]>
  {
    var range = getRoundRange(start, end);
    var k = range.key;
    var v = cache[k];
    function fetchAhead() {
      var prev = previousPage(start, end);
      var next = nextPage(start, end);
      refresh(cache, teamid, calid, prev.start, prev.end);
      refresh(cache, teamid, calid, next.start, next.end);
    }
    if (v !== undefined) {
      var deferredEvents = refresh(cache, teamid, calid, start, end);
      if (whenRefreshed !== undefined)
        deferredEvents.then(whenRefreshed);
      fetchAhead();
      return Promise.defer(v);
    }
    else {
      var result = refresh(cache, teamid, calid, start, end);
      fetchAhead();
      return result;
    }
  }

  export interface Cache {
    get : (start : Date, end : Date) => ApiT.CalendarEvent[];
    fetch : (start : Date, end : Date) => JQueryPromise<ApiT.CalendarEvent[]>;
    clear : () => void;
  }

  function create(teamid : string, calid : string) : Cache {
    var cache = <PrivateCache> {};
    return {
      get: function(start, end) {
        return get(cache, start, end);
      },
      fetch: function(start, end) {
        return fetch(cache, teamid, calid, start, end, undefined);
      },
      clear: function() {
        clear(cache);
      }
    };
  };

  interface AllCaches {
    [teamid : string] : TeamCaches;
  }

  interface TeamCaches {
    [calid : string] : Cache;
  }

  /* One cache per team calendar */
  var allCaches = <AllCaches> {};

  /* Create a cache for the team as needed */
  export function getCache(teamid : string, calid : string) : Cache {
    var teamCaches = allCaches[teamid];
    if (teamCaches === undefined) {
      teamCaches = allCaches[teamid] = <TeamCaches> {};
    }
    var cache = teamCaches[calid];
    if (cache === undefined) {
      cache = create(teamid, calid);
      teamCaches[calid] = cache;
    }
    return cache;
  };
}
