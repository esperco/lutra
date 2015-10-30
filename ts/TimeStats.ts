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

  export enum Interval { DAILY, WEEKLY, MONTHLY };

  export interface StatRequest {
    teamId: string;
    calId: string;
    numIntervals: number;
    interval: Interval
  }

  export interface StatResults {
    starts: Date[];
    stats: ApiT.CalendarStats[];
    ready?: boolean;
    error?: Error;
  }

  // Query for last X intervals of time stats
  class IntervalQueryClass extends Emit.EmitPipeBase {
    constructor() {
      // This query updates when stat store does
      super([statStore]);
    }

    // Return synchronous data -- can safely be called within React render
    // context
    get(val: StatRequest): StatResults {
      var startDates = this.startDates(val);

      var fn = ApiC.postForCalendarStats;
      var keyStr = fn.strFunc([
        val.teamId, val.calId,
        this.makeCalendarStatsRequest(startDates, val.interval)
      ]);
      var storeGet = fn.store.get(keyStr);
      var data = storeGet && storeGet[0];
      var metadata = storeGet && storeGet[1];

      return {
        starts: startDates,
        stats: data && data.stats,
        ready: metadata
          && metadata.dataStatus === Model.DataStatus.READY,
        error: metadata
          && metadata.dataStatus === Model.DataStatus.FETCH_ERROR
          && metadata.lastError
      };
    }

    // Trigger async call -- should be called outside React
    async(val: StatRequest) {
      ApiC.postForCalendarStats(val.teamId, val.calId,
        this.makeCalendarStatsRequest(this.startDates(val), val.interval)
      );
    }

    // Calculate start dates for each interval
    startDates(val: StatRequest): Date[] {
      var ret: Date[] = [];
      var addToRet = (startM: moment.Moment) => {
        ret.unshift(startM.clone().toDate());
      };

      // Prepend the current time period and work backwards from there
      var intervalStr = this.momentStr(val.interval);
      var i = moment().startOf(intervalStr);
      addToRet(i);

      if (val.numIntervals > 1) {
        _.times(val.numIntervals - 1, () => {
          i = i.subtract(1, intervalStr);
          addToRet(i);
        });
      }

      return ret;
    }

    makeCalendarStatsRequest(starts: Date[], interval: Interval) {
      var end = moment(starts[starts.length - 1])
        .clone().endOf(this.momentStr(interval))
        .toDate();
      return {
        window_starts: _.map(starts, XDate.toString),
        window_end: XDate.toString(end)
      }
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


  ////

  // Combines stat results to get aggregate data by label
  export function aggregate(results: ApiT.CalendarStats[]): ApiT.CalendarStats {
    var accumulator: ApiT.CalendarStats = {
      by_label: {},
      unlabelled: {
        event_count: 0,
        event_duration: 0
      },
      total: {
        event_count: 0,
        event_duration: 0
      }
    };

    return _.reduce(results, (agg: ApiT.CalendarStats,
                              stat: ApiT.CalendarStats) => {
      _.each(stat.by_label, (v, name) => {
        var statEntry: ApiT.CalendarStatEntry = agg.by_label[name] =
          agg.by_label[name] || {
            event_count: 0,
            event_duration: 0
          };
        addTo(statEntry, v);
      });
      addTo(agg.unlabelled, stat.unlabelled);
      addTo(agg.total, stat.total);
      return agg;
    }, accumulator);
  }

  function addTo(entry: ApiT.CalendarStatEntry, plus: ApiT.CalendarStatEntry) {
    entry.event_count += plus.event_count;
    entry.event_duration += plus.event_duration;
  }

  /*
    Time stat durations are normally seconds. This normalizes to hours and
    rounds to nearest .01 hour -- rounding may be slightly off because of
    floating point arithmetic but that should be OK in most cases
  */
  export function toHours(seconds: number) {
    return Number((seconds / 3600).toFixed(2))
  }
}