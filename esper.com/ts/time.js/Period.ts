/*
  Helpers for representing a period of time as an absolute integer
*/
module Esper.Period {
  export type Interval = 'week'|'month'|'quarter';
  export interface Single {
    interval: Interval;
    index: number;
  }
  export interface Range {
    interval: Interval;
    start: number;
    end: number;
  }

  /*
    The "0" period for each interval is the period which contains the epoch.
    Note that we're currently using *local* time for thinking about intervals.
  */
  export const Epoch = new Date(1970, 0, 1);

  export function singleFromDate(interval: Interval, start: Date): Single {
    var epochForInterval = moment(Epoch).startOf(interval);
    var index = moment(start)
      .startOf(interval)
      .diff(epochForInterval, interval);
    return {
      interval: interval,
      index: index
    }
  }

  export function current(interval: Interval): Single {
    return singleFromDate(interval, new Date());
  }

  // +1 => One interval after current
  // -1 => One interval before current
  export function relativeIndex(period: Single) {
    return period.index - current(period.interval).index;
  }

  export function rangeFromDates(interval: Interval, start: Date, end: Date)
    : Range
  {
    return {
      interval: interval,
      start: singleFromDate(interval, start).index,
      end: singleFromDate(interval, end).index
    }
  }

  export function boundsFromPeriod(period: Single): [Date, Date] {
    var startM = moment(Epoch).add(period.index, period.interval);
    var endM = startM.clone().endOf(period.interval);
    return [startM.toDate(), endM.toDate()];
  }
}
