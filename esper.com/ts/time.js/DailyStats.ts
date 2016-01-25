/*
  Module for storing, querying, and manipulating time-stats data for
  auto-charts
*/

/// <reference path="./TimeStats.ts" />

module Esper.DailyStats {

  // Use API's cache for this -- values here rarely change, so we should be
  // fine
  export var StatStore = ApiC.postForDailyStats.store;

  type RequestPeriod = TimeStats.RequestPeriod;

  /*
    Asynchronously make call to server data for time stats data.
  */
  export function async(start: Date, end: Date,
    calendars: Calendars.CalSelection[])
  {
    if (! calendars.length) {
      Log.e("DailyStats.async called with no calendars selected");
      return;
    }
    return ApiC.postForDailyStats(
      requestToJSON({ windowStart: start, windowEnd: end }, calendars)
    );
  }

  function requestToJSON(x: RequestPeriod,
      calendars: Calendars.CalSelection[]): ApiT.DailyStatsRequest
  {
    return {
      window_start: XDate.toString(x.windowStart),
      window_end: XDate.toString(x.windowEnd),
      calendars: _.map(sortCals(calendars), (c) => {
        return {
          teamid: c.teamId,
          calid: c.calId
        };
      })
    };
  }

  // Sort team and calendars, so requests are normalized and produce
  // consistent cachek eys
  function sortCals(calendars: Calendars.CalSelection[]) {
    return _.sortBy(calendars, (c) => c.teamId + " " + c.calId);
  }

  export function get(start: Date, end: Date,
    calendars?: Calendars.CalSelection[])
  {
    if (! calendars.length) {
      Log.e("DailyStats.get called with no calendars selected");
      return;
    }
    var key = storeKey(start, end, calendars);
    return StatStore.get(key);
  }

  // Return string key used to access store based on vars
  function storeKey(start: Date, end: Date,
      calendars?: Calendars.CalSelection[])
  {
    return ApiC.postForDailyStats.strFunc([
      requestToJSON({ windowStart: start, windowEnd: end }, calendars)
    ]);
  }

}
