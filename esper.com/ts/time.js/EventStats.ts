/*
  Client-side time stat calculations
*/

module Esper.EventStats {

  export interface DurationOpts {
    // Truncate duration if start is before this date/time
    truncateStart?: Date;

    // Truncate duration if end is after this date/time
    truncateEnd?: Date;
  }

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
