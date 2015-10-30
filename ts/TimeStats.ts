/*
  Module for storing and querying time-stat data
*/

/// <reference path="../marten/ts/Emit.ts" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="../marten/ts/XDate.ts" />
/// <reference path="./Esper.ts" />

module Esper.TimeStats {

  // Use API's cache for this -- values here rarely change, so we should be
  // fine
  export var statStore = ApiC.postForCalendarStats.store;

  enum Interval { DAILY, WEEKLY, MONTHLY };

  interface StatRequest {
    teamId: string;
    calId: string;
    numIntervals: number;
    interval: Interval
  }

  interface StatResult {
    start: Date;
    stats: ApiT.CalendarStats;
    ready?: boolean;
    error?: Error;
  }

  // Query for last X intervals of time stats
  class IntervalQueryClass extends Emit.EmitPipeBase {
    constructor() {
      // This query updates when stat store does
      super([statStore]);
    }

    get(val: StatRequest): StatResult[] {
      var ret: StatResult[] = [];

      // Prepend the current time period and work backwards from there
      var intervalStr = this.momentStr(val.interval);
      var i = moment().startOf(intervalStr);
      ret.unshift(this.makeResult(val, i.clone().toDate()));

      if (val.numIntervals > 1) {
        var self = this;
        _.times(val.numIntervals - 1, function() {
          i = i.subtract(1, intervalStr);
          ret.unshift(self.makeResult(val, i.clone().toDate()));
        });
      }

      return ret;
    }

    makeResult(req: StatRequest, start: Date): StatResult {
      var end = moment(start)
                  .clone()
                  .endOf(this.momentStr(req.interval))
                  .toDate();
      var calReq = this.makeCalendarRequest(start, end);

      // Post request -- we don't need promise here. We'll check store and
      // have that reactively update.
      var fn = ApiC.postForCalendarStats;
      fn(req.teamId, req.calId, calReq);

      var keyStr = fn.strFunc([req.teamId, req.calId, calReq]);
      var storeGet = fn.store.get(keyStr);
      var data = storeGet && storeGet[0];
      var metadata = storeGet && storeGet[1];

      return {
        start: start,
        stats: data,
        ready: metadata
          && metadata.dataStatus === Model.DataStatus.READY,
        error: metadata
          && metadata.dataStatus === Model.DataStatus.FETCH_ERROR
          && metadata.lastError
      };
    }

    makeCalendarRequest(start: Date, end: Date): ApiT.CalendarRequest {
      return {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      };
    }

    // Returns the string Moment.js uses for an interval
    momentStr(interval: Interval): string {
      switch(interval) {
        case Interval.DAILY:
          return 'day';
        case Interval.WEEKLY:
          return 'week';
        default: // Monthly
          return 'month';
      }
    }
  }

  export var intervalQuery = new IntervalQueryClass();
}