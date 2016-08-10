/*
  Helpers for representing a period of time as an absolute integer
*/

/// <reference path="./Types.ts" />

module Esper.Period {
  export type Interval = Types.Interval;
  export type Single = Types.SinglePeriod;
  export type CustomInterval = Types.CustomInterval;
  export type IntervalOrCustom = Types.IntervalOrCustom;
  export type Custom = Types.CustomPeriod;
  export type Range = Types.PeriodRange;

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

  export function customFromDates(start: Date, end: Date): Custom {
    return {
      interval: "custom",
      start: moment(start).diff(moment(Epoch), 'days'),
      end: moment(end).diff(moment(Epoch), 'days')
    };
  }

  export function current(interval: Interval): Single;
  export function current(interval: CustomInterval): Custom;
  export function current(interval: IntervalOrCustom): Single|Custom;
  export function current(interval: IntervalOrCustom): Single|Custom {
    if (isCustomInterval(interval)) {
      // Default to current week
      var w = singleFromDate("week", new Date());
      var bounds = boundsFromPeriod(w);
      return {
        interval: "custom",
        start: moment(bounds[0]).diff(moment(Epoch), 'days'),
        end: moment(bounds[1]).diff(moment(Epoch), 'days')
      };
    } else {
      return singleFromDate(interval, new Date());
    }
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

  // Beginning and end of period
  export function boundsFromPeriod(period: Single|Custom): [Date, Date] {
    if (isCustom(period)) {
      let startM = moment(Epoch).startOf('day').add(period.start, 'days');
      let endM = moment(Epoch).endOf('day').add(period.end, 'days');
      return [startM.toDate(), endM.toDate()];
    } else {
      let startM = moment(Epoch).startOf(period.interval)
                    .add(period.index, period.interval);
      let endM = startM.clone().endOf(period.interval);
      return [startM.toDate(), endM.toDate()];
    }
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

  // If you need a relative number for comparing periods of identical intervals
  export function asNumber(p: Single|Custom) {
    if (isCustom(p)) {
      return p.start;
    } else {
      return p.index;
    }
  }

  export function isCustom(p: Single|Custom): p is Custom {
    var typedP = <Custom> p;
    return typedP.interval === "custom";
  }

  export function isCustomInterval(x: IntervalOrCustom): x is CustomInterval {
    return x === "custom";
  }

  /*
    Given a period, returns a list of periods incremented from that period.
    -- i.e. if showing Febrary 2016. Then incrs of -1,1 will return periods
    for January and March 2016.
  */
  export function withIncrs(p: Single, incrs: number[]): Single[];
  export function withIncrs(p: Custom, incrs: number[]): Custom[];
  export function withIncrs(p: Single|Custom, incrs: number[])
    : Array<Single|Custom>;
  export function withIncrs(p: Single|Custom, incrs: number[])
    : Array<Single|Custom>
  {
    incrs = _.sortBy(incrs);
    return _.map(incrs, (i) => incr(p, i));
  }

  export function incr(p: Single, i: number): Single;
  export function incr(p: Custom, i: number): Custom;
  export function incr(p: Single|Custom, i: number): Single|Custom;
  export function incr(p: Single|Custom, i: number): Single|Custom {
    var pCopy = _.cloneDeep(p);
    if (isCustom(pCopy)) {
      var duration = (pCopy.end - pCopy.start) + 1;
      pCopy.start += duration * i;
      pCopy.end += duration * i;
    } else {
      pCopy.index += i;
    }
    return pCopy;
  }
}
