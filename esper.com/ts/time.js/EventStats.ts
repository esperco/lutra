/*
  Client-side time stat calculations
*/

module Esper.EventStats {
  export interface HasEvent {
    event: Stores.Events.TeamEvent;
  }

  export interface HasDurations extends HasEvent {
    // End - start (seconds)
    duration: number;

    // Duration may need to be adjusted for overlapping events and other
    // weirdness
    adjustedDuration: number;
  }

  export interface DurationOpts {
    // Truncate duration if start is before this date/time
    truncateStart?: Date;

    // Truncate duration if end is after this date/time
    truncateEnd?: Date;
  }

  /* Shortcut types */
  export type EventGrouping = Partition.KeyList<Stores.Events.TeamEvent>;
  export type DurationsGrouping<T> = Partition.KeyList<T & HasDurations>;

  ////

  export function getDurations<T extends HasEvent>(eventWrappers: T[],
    opts: DurationOpts = {}): Array<T & HasDurations>
  {
    // Make sure events are sorted by start date
    eventWrappers = _.sortBy(eventWrappers,
      (e) => moment(e.event.start).valueOf()
    );

    // Convert wrapper to duration object
    var ret = _.map(eventWrappers, (e) => {
      var event = e.event;
      var duration = Math.floor(
        moment(event.end).diff(moment(event.start)) / 1000
      );
      return _.extend({}, e, {
        duration: duration,
        adjustedDuration: 0
      }) as T & HasDurations
    });

    /* Overlap, truncate calculation */

    // Use strings for maps because numbers convert to Array
    var startMap: {[index: string]: Array<T & HasDurations>} = {};
    var endMap: {[index: string]: Array<T & HasDurations>} = {};

    // Critical points = start / end points
    var criticalPoints: number[] = [];

    _.each(ret, (e) => {

      // Truncate start
      var event = e.event;
      var startM = moment(event.start);
      if (opts.truncateStart && moment(opts.truncateStart).diff(startM) > 0) {
        startM = moment(opts.truncateStart);
      }
      var start = startM.valueOf();

      // Truncate end
      var endM = moment(event.end);
      if (opts.truncateEnd && moment(opts.truncateEnd).diff(endM) < 0) {
        endM = moment(opts.truncateEnd);
      }
      var end = endM.valueOf();

      // Ignore invalid start/end dates (possible after truncation)
      if (end <= start) { return; }

      // Map critical points to check for overlaps
      var startStr = start.toString();
      var endStr = end.toString();
      startMap[startStr] = startMap[startStr] || [];
      startMap[startStr].push(e);
      endMap[endStr] = endMap[endStr] || [];
      endMap[endStr].push(e);
      criticalPoints.push(start);
      criticalPoints.push(end);
    });

    criticalPoints.sort();
    var criticalPoints = _.sortedUniq(criticalPoints);

    // Stack of active events as we move through time
    var eventStack:  Array<T & HasDurations> = [];

    _.each(criticalPoints, (p, i) => {
      // Add and remove from current stack
      var str = p.toString();
      eventStack = eventStack.concat(startMap[str] || []);
      _.each(endMap[str] || [], (e) => {
        eventStack = _.without(eventStack, e)
      });

      // Add time to each event in the stack
      var next = criticalPoints[i + 1];
      if (next) {
        var incr = ((next - p) / eventStack.length) / 1000;
        _.each(eventStack, (e) => e.adjustedDuration += incr);
      }
    });

    return ret;
  }

  //////

  /*
    Shortcut for pattern where we:
    * Filter events
    * Generate a wrapper around event
    * Calculate durations

    Takes a list of events and a function that returns an option with
    the wrapper. If option is none, we leave event out of durations calc.
  */
  export function wrapWithDurations<W extends HasEvent>(
    events: Stores.Events.TeamEvent[],
    fn: (e: Stores.Events.TeamEvent) => Option.T<W>,
    opts?: DurationOpts
  ): Array<W & HasDurations> {
    var options = _.map(events, fn);
    var wrappers = Option.flatten(options);
    return getDurations(wrappers, opts);
  }


  //////

  // Simple aggregate duration of events, avoids double-counting overlaps
  export function aggregateDuration(events: Stores.Events.TeamEvent[]) {
    var agg = 0;
    var lastEnd: number;

    events = _.sortBy(events, (e) => moment(e.start).unix());
    _.each(events, (e) => {
      var start = moment(e.start).unix();
      var end = moment(e.end).unix();

      start = (lastEnd && lastEnd > start) ? lastEnd : start;
      var duration = end - start;
      if (duration > 0) {
        agg += duration;
        lastEnd = end;
      }
    });

    return agg;
  }


  /////

  /*
    Time stat durations are normally seconds. This normalizes to hours and
    rounds to nearest .05 hour -- rounding may be slightly off because of
    floating point arithmetic but that should be OK in most cases.
  */
  export function toHours(seconds: number) {
    return Number((Math.round((seconds / 3600) / 0.05) * 0.05).toFixed(2));
  }
}
