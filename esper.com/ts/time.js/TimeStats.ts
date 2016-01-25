/*
  Module for storing, querying, and manipulating time-stats data for
  labeled calendar data
*/

/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/XDate.ts" />
/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Teams.ts" />
/// <referenec path="./Calendars.ts" />
/// <reference path="./Esper.ts" />

module Esper.TimeStats {

  // Temporary cap on max intervals to avoid potential weirdness
  export const MAX_INTERVALS = 10;

  // Cap on maximum lenth of time period analyzed
  export const MAX_TIME: moment.MomentInput = {months: 6};

  // Earliest possible start time
  export const MIN_DATE = moment().subtract(6, 'months');

  // Earliest possible end time
  export const MAX_DATE = moment().add(6, 'months');

  // Helper function for returning a max period based on interval
  export function dateLimitForInterval(interval: Interval)
    : moment.MomentInput
  {
    var intervalDuration: moment.MomentInput;
    switch (interval) {
      case Interval.DAILY:
        intervalDuration = {days: MAX_INTERVALS};
        break;
      case Interval.WEEKLY:
        intervalDuration = {days: MAX_INTERVALS * 7};
        break;
      default:
        intervalDuration = {months: MAX_INTERVALS};
    }

    var maxMs = moment.duration(MAX_TIME).as('milliseconds');
    var intervalMs = moment.duration(intervalDuration).as('milliseconds');
    if (intervalMs > maxMs) {
      return MAX_TIME;
    }

    return intervalDuration;
  }

  // Use API's cache for this -- values here rarely change, so we should be
  // fine
  export var StatStore = ApiC.postForCalendarStats.store;

  // Use for specifying a time period to request data from
  export interface RequestPeriod {
    windowStart: Date;
    windowEnd: Date;
    interval?: Interval;
  }

  export enum Interval { DAILY=1, WEEKLY, MONTHLY };

  /*
    Returns a stat request based on recent intervals -- e.g. last 5 days
    from today
  */
  export function intervalCountRequest(count: number, interval: Interval)
    : RequestPeriod
  {
    if (count < 1) {
      throw new Error("Interval count must be > 0");
    }

    var now = moment();
    var intervalStr = momentStr(interval);

    var end = now.clone().endOf(intervalStr);
    var start = now.startOf(intervalStr).subtract(count - 1, intervalStr);

    return {
      windowStart: start.toDate(),
      windowEnd: end.toDate(),
      interval: interval
    };
  }

  /*
    Synchronously returns store value for time stats data.
  */
  export function get(teamId: string, calId: string, req: RequestPeriod)
  {
    var key = storeKey(teamId, calId, req);
    return ApiC.postForCalendarStats.store.get(key);
  }

  /*
    Asynchronously make call to server data for time stats data.
    If no team, calendar, or TypedStatRequest are passed, get from default
    select store sources. If no defaults set, return null.
  */
  export function async(teamId: string, calId: string, req: RequestPeriod)
  {
    return ApiC.postForCalendarStats(teamId, calId, requestToJSON(req));
  }

  // Return string key used to access store based on vars
  function storeKey(teamId: string, calId: string, req: RequestPeriod) {
    var fn = ApiC.postForCalendarStats;
    return fn.strFunc([teamId, calId, requestToJSON(req)]);
  }

  /*
    Converts our request period into stringified list of windows version for
    API call
  */
  export function requestToJSON(req: RequestPeriod)
    : ApiT.CalendarStatsRequest
  {
    // Convert to moment
    var mStart = moment(req.windowStart);
    if (! mStart.isBefore(req.windowEnd)) {
      throw new Error("End should be before start");
    }

    var starts: Date[] = [req.windowStart];
    var end = req.windowEnd;

    if (! _.isUndefined(req.interval)) {
      var intervalStr = momentStr(req.interval);
      var current = mStart.clone().startOf(intervalStr).add(1, intervalStr);
      while (current.isBefore(req.windowEnd)) {
        starts.push(current.toDate());
        current = current.clone().add(1, intervalStr);
      }

      // Cap intervals
      if (starts.length > MAX_INTERVALS) {
        end = starts[MAX_INTERVALS];
        starts = starts.slice(0, MAX_INTERVALS);
      }
    }

    return {
      window_starts: _.map(starts, XDate.toString),
      window_end: XDate.toString(req.windowEnd)
    };
  }

  // Returns the string Moment.js uses for an interval
  function momentStr(interval: Interval): string {
    switch(interval) {
      case Interval.DAILY:
        return 'day';
      case Interval.WEEKLY:
        return 'week';
      default: // Monthly
        return 'month';
    }
  }


  ////

  // Stats for a single label
  export interface StatsForLabel {
    displayAs: string,   // Display name
    count: number,
    duration: number       // seconds
  }

  // Collection of stats mapped to labels from normative label
  export interface StatsByLabel {
    [index: string]: StatsForLabel
  }

  export interface ValuesByLabel {
    [index: string]: {          // Normalized label
      displayAs: string,      // Display name
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
      var i = 0;
      _.each(s.event_labels_norm, (label) => {
        var x = ret[label] = ret[label] || {
          displayAs: s.event_labels[i],
          count: 0,
          duration: 0
        };

        x.count += s.event_count;
        x.duration += s.event_duration;
        i += 1;
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
        _.intersection(labels, s.event_labels_norm) :
        s.event_labels_norm
      );
      var displayAsMap: {[index: string]: string} = {};
      _.each(s.event_labels_norm, (normLabel, i) => {
        displayAsMap[normLabel] = s.event_labels[i]
      });

      _.each(eventLabels, (label) => {
        var x = ret[label] = ret[label] || {
          displayAs: displayAsMap[label] || label,
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
      _.each(stats, (s, labelNorm) => {
        var labelVal = ret[labelNorm] = ret[labelNorm] || {
          displayAs: s.displayAs,
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

  // Calculate data for duration over time calculations
  export type DisplayResults = {
    labelNorm: string;
    displayAs: string;
    totalDuration: number;   // seconds
    durations: number[];     // seconds
    totalCount: number;
    counts: number[];
  }[];

  export function getDisplayResultsBase(stats: StatsByLabel[], teamId?: string)
    : DisplayResults
  {
    var valMap = valuesByLabel(stats);
    var ret = _.map(valMap, (vals, labelNorm) => {
      return {
        labelNorm: labelNorm,
        displayAs: vals.displayAs,
        totalDuration: _.sum(vals.durations),
        durations: vals.durations,
        totalCount: _.sum(vals.counts),
        counts: vals.counts
      };
    });

    // If teamId, filter
    if (teamId) {
      // Use displayAs since task labels don't have concept of normalization
      ret = filterLabels(teamId, ret, (r) => r.displayAs);
    }

    return ret;
  }

  export function getDisplayResults(stats: ApiT.CalendarStats[],
    teamId?: string): DisplayResults
  {
    var labels = _.map(stats, (stat) =>
      partitionByLabel(stat.partition)
    );
    return getDisplayResultsBase(labels);
  }

  // Like getDisplayResults, but using exclusivePartitionByLabel
  export function getExclusiveDisplayResults(stats: ApiT.CalendarStats[],
    teamId?: string): DisplayResults
  {
    var labels = _.map(stats, (stat) =>
      exclusivePartitionByLabel(stat.partition)
    );
    return getDisplayResultsBase(labels);
  }


  /////

  /*
    Get formatted names for chart columns
  */
  export interface FormattedWindowStarts {
    typeLabel: string; // "Day"
    groupLabels: string[]; // "Jun 1", "Jun 2", etc.
  }

  export function formatWindowStarts(stats: ApiT.CalendarStats[],
    interval: Interval): FormattedWindowStarts
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
    var groupLabels = _.map(stats,
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
      return (
        t === team.team_label_new ||
        t === team.team_label_done ||
        t === team.team_label_canceled ||
        t === team.team_label_pending ||
        t === team.team_label_urgent ||
        t === team.team_label_in_progress);
    });
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
