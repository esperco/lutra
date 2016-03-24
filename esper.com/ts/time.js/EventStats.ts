/*
  Client-side time stat calculations
*/

/// <reference path="./Events2.ts" />

module Esper.EventStats {
  export interface AnnotatedEvent extends Events2.TeamEvent {
    // End - start
    duration: number;

    // Duration may need to be adjusted for overlapping events and other
    // weirdness
    adjustedDuration: number;
  }

  export interface AnnotateOpts {
    // Truncate duration if start is before this date/time
    truncateStart?: Date;

    // Truncate duration if end is after this date/time
    truncateEnd?: Date;
  }

  export function annotate(events: Events2.TeamEvent[]): AnnotatedEvent[]
  {
    // Make sure events are sorted by start date
    events = _.sortBy(events, (e) => moment(e.start).valueOf());

    // Created annoted event ojbects
    var ret = _.map(events, (e) => {
      var duration = Math.floor(moment(e.end).diff(moment(e.start)) / 1000);
      return _.extend({}, e, {
        duration: duration,
        adjustedDuration: 0
      }) as AnnotatedEvent
    });


    /* Overlap calculation */

    // Use strings for maps because numbers convert to Array
    var startMap: {[index: string]: AnnotatedEvent[]} = {};
    var endMap: {[index: string]: AnnotatedEvent[]} = {};

    // Critical points = start / end points
    var criticalPoints: number[] = [];

    _.each(ret, (e) => {
      var start = moment(e.start).valueOf();
      var end = moment(e.end).valueOf();
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
    var eventStack: AnnotatedEvent[] = [];

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

}
