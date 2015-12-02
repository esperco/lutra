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

    // Removes old stat data from store
    invalidate() {
      // Naive cache invalidation => just wipe everything for now
      statStore.reset();
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

  // Expand CalendarStatsEntry to contain list of values
  export interface AggCalendarStatEntry extends ApiT.CalendarStatEntry {
    countValues: number[];
    durationValues: number[];
  }

  export interface AggCalendarStats extends ApiT.CalendarStats {
    by_label: {
      [index: string]: AggCalendarStatEntry
    },
    unlabelled: AggCalendarStatEntry,
    total: AggCalendarStatEntry
  }

  // Combines stat results to get aggregate data by label
  export function aggregate(results: ApiT.CalendarStats[]): AggCalendarStats {
    var accumulator: AggCalendarStats = {
      by_label: {},
      unlabelled: {
        event_count: 0,
        event_duration: 0,
        countValues: [],
        durationValues: []
      },
      total: {
        event_count: 0,
        event_duration: 0,
        countValues: [],
        durationValues: []
      }
    };

    return _.reduce(results, (agg: AggCalendarStats,
                              stat: ApiT.CalendarStats,
                              index: number) => {
      _.each(stat.by_label, (v, name) => {
        var statEntry: AggCalendarStatEntry = agg.by_label[name] =
          agg.by_label[name] || {
            event_count: 0,
            event_duration: 0,
            countValues: [],
            durationValues: []
          };

        // This label may be new, so prefill 0s up to current index
        _.times(index - statEntry.countValues.length, () => {
          statEntry.countValues.push(0);
          statEntry.durationValues.push(0);
        });

        addTo(statEntry, v);
      });

      // Bump up any remaining stats
      _.each(agg.by_label, (v, name) => {
        _.times(index + 1 - v.countValues.length, () => {
          v.countValues.push(0);
          v.durationValues.push(0);
        });
      });

      addTo(agg.unlabelled, stat.unlabelled);
      addTo(agg.total, stat.total);
      return agg;
    }, accumulator);
  }

  function addTo(entry: AggCalendarStatEntry, plus: ApiT.CalendarStatEntry) {
    entry.event_count += plus.event_count;
    entry.event_duration += plus.event_duration;
    entry.countValues.push(plus.event_count);
    entry.durationValues.push(plus.event_duration);
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