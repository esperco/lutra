/*
  Module for storing and querying time-stat data
*/

/// <reference path="../marten/ts/Emit.ts" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="../marten/ts/XDate.ts" />
/// <reference path="./Teams.ts" />
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
    stats : ApiT.CalendarStats[];
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
        stats: data && data.items,
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

  // Stats for a single label
  export interface StatsForLabel {
    count: number,
    duration: number // seconds
  }

  // Collection of stats mapped to labels
  export interface StatsByLabel {
    [index: string]: StatsForLabel
  }

  export interface ValuesByLabel {
    [index: string]: {
      totalCount: number,
      counts: number[],
      totalDuration: number,
      durations: number[] // seconds
    };
  }

  /*
    Adds up totals for each individual label. If an event has multiple labels,
    the entirety of each event's duration will be attributed to each label's
    total.
  */
  export function partitionByLabel(stats: ApiT.CalendarStatEntry[]) {
    var ret: StatsByLabel = {};
    _.each(stats, (s) => {
      _.each(s.event_labels, (label) => {
        var x = ret[label] = ret[label] || {
          count: 0,
          duration: 0
        };

        x.count += s.event_count;
        x.duration += s.event_duration;
      });
    });
    return ret;
  }

  /*
    Like partitionByLabel, but avoids double-counting events with multiple
    labels on them by attributing only a fraction of the duration of the event
    to each label on the event (divided equally among all labels on the event
    by default -- can be restricted to only consider certain labels by passing
    a list of labels as the second argument).

    Counts are unaffected.
  */
  export function exclusivePartitionByLabel(stats: ApiT.CalendarStatEntry[],
                                            labels?: string[])
  {
    var ret: StatsByLabel = {};
    _.each(stats, (s) => {
      var eventLabels = (labels ?
        _.intersection(labels, s.event_labels) :
        s.event_labels
      );
      _.each(eventLabels, (label) => {
        var x = ret[label] = ret[label] || {
          count: 0,
          duration: 0
        };

        x.count += s.event_count;
        x.duration += (s.event_duration / eventLabels.length);
      });
    });
    return ret;
  }

  /*
    Returns a map from labels to list of values for each label, filling in
    zeros as appropriate
  */
  export function valuesByLabel(statsByLabel: StatsByLabel[]) {
    var ret: ValuesByLabel = {};
    var i = 0;
    var stats: StatsByLabel;
    for (var i = 0; i < statsByLabel.length; i++) {
      stats = statsByLabel[i];
      _.each(stats, (s, label) => {
        var labelVal = ret[label] = ret[label] || {
          totalCount: 0,
          counts: [],
          totalDuration: 0,
          durations: []
        }
        labelVal.totalCount += s.count;
        labelVal.counts[i] = s.count;
        labelVal.totalDuration += s.duration;
        labelVal.durations[i] = s.duration;
      });
    }

    // Normalize undefined to 0
    _.each(ret, (v, k) => {
      for (var j = 0; j < statsByLabel.length; j++) {
        v.counts[j] = v.counts[j] || 0;
        v.durations[j] = v.durations[j] || 0;
      }
    });

    return ret;
  }


  /////

  export function getDurationsOverTime(results: StatResults, teamId?: string)
    : DurationsOverTimeResults
  {
    // Safety check
    if (! (results && results.ready && results.stats)) {
      return;
    }

    var starts = _.map(results.stats, (stat) => stat.window_start);
    var labels = _.map(results.stats, (stat) =>
      partitionByLabel(stat.partition)
    );
    var valMap = valuesByLabel(labels);
    var ret = _.map(valMap, (vals, labelName) => {
      return {
        label: labelName,
        total: _.sum(vals.durations),
        values: vals.durations
      };
    });
    ret = _.sortBy(ret, (x) => -x.total);

    // If teamId, filter
    if (teamId) {
      ret = filterLabels(teamId, ret, (r) => r.label);
    }

    return ret;
  }


  /////

  /*
    Get formatted names for chart columns
  */
  export interface FormattedWindowStarts {
    typeLabel: string; // "Day"
    groupLabels: string[]; // "Jun 1", "Jun 2", etc.
  }

  export function formatWindowStarts(results: StatResults, interval: Interval)
    : FormattedWindowStarts
  {
    var typeLabel: string;
    var startFormat: string;
    switch(interval) {
      case TimeStats.Interval.DAILY:
        typeLabel = "Day"
        startFormat = "MMM D"
        break;
      case TimeStats.Interval.MONTHLY:
        typeLabel = "Month"
        startFormat = "MMM"
        break;
      default:
        typeLabel = "Week Starting";
        startFormat = "MMM D";
    }
    var groupLabels = _.map(results.stats,
      // MMM d => Oct 4
      (stat) => moment(stat.window_start).format(startFormat)
    );

    return {
      typeLabel: typeLabel,
      groupLabels: groupLabels
    };
  }

  // Helper to filter out task labels
  export function filterLabels<T>(teamId: string, labels: T[],
                                  transform?: (t: T) => string)
  {
    var team = Teams.get(teamId);
    if (! team) {
      return labels;
    }

    transform = transform || _.identity;

    // Filter out task-related labels
    return _.reject(labels, (label) => {
      var t = transform(label);
      return
        t === team.team_label_new ||
        t === team.team_label_done ||
        t === team.team_label_canceled ||
        t === team.team_label_pending ||
        t === team.team_label_urgent ||
        t === team.team_label_in_progress;
    });
  }

  // Calculate data for duration over time calculations
  export type DurationsOverTimeResults = {
    label: string;
    total: number;   // seconds
    values: number[]; // seconds
  }[];

  /*
    Time stat durations are normally seconds. This normalizes to hours and
    rounds to nearest .01 hour -- rounding may be slightly off because of
    floating point arithmetic but that should be OK in most cases
  */
  export function toHours(seconds: number) {
    return Number((seconds / 3600).toFixed(2))
  }
}