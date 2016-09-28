/*
  Helpers for representing a period of time as an absolute integer
*/

/// <reference path="./Types.ts" />

module Esper.Period {
  export type Interval = Types.Interval;

  /*
    The "0" period for each interval is the period which contains the epoch.
    Note that we're currently using *local* time for thinking about intervals.
  */
  export const Epoch = new Date(1970, 0, 1);

  export function fromDates(interval: Interval, start: Date, end: Date)
    : Types.Period
  {
    let epochForInterval = moment(Epoch).startOf(interval);
    return {
      interval: interval,
      start: moment(start).diff(epochForInterval, interval),
      end: moment(end).diff(epochForInterval, interval)
    }
  }

  export function bounds({interval, start, end}: Types.Period): [Date, Date] {
    let epochForInterval = moment(Epoch).startOf(interval);
    return [
      epochForInterval.clone().add(start, interval).toDate(),
      epochForInterval.clone().add(end, interval).endOf(interval).toDate()
    ];
  }

  export function now(interval: Interval) {
    let d = new Date();
    return fromDates(interval, d, d);
  }

  // Increment period range -- keeps same difference between start and end
  export function add(p: Types.Period, i: number): Types.Period {
    let diff = p.end - p.start;
    let start = p.start + (diff + 1) * i;
    let end = start + diff;
    return { interval: p.interval, start, end };
  }

  // Get a list of dates from start / end dates
  export function datesFromBounds(start: Date, end: Date) {
    var startM = moment(start).startOf('day');
    var endM = moment(end).endOf('day');
    var ret: Date[] = [];
    while (endM.diff(startM) > 0) {
      ret.push(startM.clone().toDate());
      startM = startM.add(1, 'day');
    }
    return ret;
  }

  // Converts single period to range version (adds some intervals)
  export function toRange(period: Types.Period, maxDate?: Date): Types.Period {
    if (period.interval === "day") { // No day ranges allowed, make week
      let [start, end] = bounds(period);
      period = fromDates("week", start, end);
    } else {
      period = _.clone(period);
    }

    if (period.start === period.end) {
      switch (period.interval) {
        case "quarter":
          period.end += 1;
          break;
        case "month":
          period.end += 2;
          break;
        default: // Week
          period.end += 4;
          break;
      }

      // Don't go past max
      if (maxDate) {
        let [start, end] = Period.bounds(period);
        if (end.getTime() > maxDate.getTime()) {
          period.end = Period.fromDates(period.interval,
            maxDate, maxDate
          ).end;
        }
      }
    }

    return period;
  }

  // Converts range period to single version (just uses the first interval)
  export function toSingle(period: Types.Period): Types.Period {
    return {
      interval: period.interval,
      start: period.start,
      end: period.start
    };
  }
}
