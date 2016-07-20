/*
  Helpers for manipulating Types.WeekHours format
*/

/// <reference path="./Period.ts" />

module Esper.WeekHours {

  // Map function against each day hour
  export function map(
    weekHours: Types.WeekHours,
    fn: (v: Option.T<Types.DayHours>,
         k: Types.DayAbbr) => Option.T<Types.DayHours>
  ) {
    return {
      sun: fn(weekHours.sun, "sun"),
      mon: fn(weekHours.mon, "mon"),
      tue: fn(weekHours.tue, "tue"),
      wed: fn(weekHours.wed, "wed"),
      thu: fn(weekHours.thu, "thu"),
      fri: fn(weekHours.fri, "fri"),
      sat: fn(weekHours.sat, "sat")
    };
  }

  /*
    Given a date and a WeekHours object, figure out the day of the week and
    return the relevant DayHours from the WeekHours
  */
  export function getDayHours(
    t: Date|moment.Moment,
    weekHours: Types.WeekHours
  ) {
    let m = t instanceof Date ? moment(t) : t;
    switch (m.day()) {
      case 0: return weekHours.sun;
      case 1: return weekHours.mon;
      case 2: return weekHours.tue;
      case 3: return weekHours.wed;
      case 4: return weekHours.thu;
      case 5: return weekHours.fri;
      case 6: return weekHours.sat;
      default: return Option.none<Types.DayHours>();
    }
  }

  /*
    Total amount of time in period, with option for filtering against only
    certain times of day / days of week
  */
  export function totalForPeriod(
    period: Period.Single|Period.Custom,
    weekHours?: Types.WeekHours
  ) {
    let bounds = Period.boundsFromPeriod(period);
    let dates = Period.datesFromBounds(bounds[0], bounds[1]);
    return _.sumBy(dates, (date) => {
      let m = moment(date);
      if (weekHours) {
        return getDayHours(m, weekHours).match({
          none: () => 0,
          some: (dh) => m.clone().hour(dh.end.hour).minute(dh.end.minute)
            .diff(m.clone().hour(dh.start.hour).minute(dh.start.minute)) / 1000
        });
      }

      /*
        NB: Go through this clone and diff exercise because not all days have
        24 hours in them (e.g. daylights savings)
      */
      return m.clone().endOf('day').diff(m.clone().startOf('day')) / 1000;
    });
  }

  // Does event overlap with week hour?
  export function overlap(event: Types.TeamEvent,
                          weekHours: Types.WeekHours)
  {
    let startM = moment(event.start).clone();
    let endM = moment(event.end);
    while (startM.diff(endM) < 0) {
      let overlaps = getDayHours(startM, weekHours)
        .match({
          none: () => false,
          some: (dh) => {
            // Hours for this day
            let dayStart = startM.clone().startOf('day');
            let dhStart = dayStart.clone().add(dh.start).valueOf();
            let dhEnd = dayStart.clone().add(dh.end).valueOf();

            // Portion of event that overlaps this day
            let eventStart = startM.valueOf();
            let eventEnd = Math.min(
              endM.valueOf(),
              startM.clone().endOf('day').valueOf()
            );

            return Math.max(dhStart, eventStart) < Math.min(dhEnd, eventEnd);
          }
        });
      if (overlaps) return true;

      // Go to next day
      startM = startM.startOf('day').add(1, 'day');
    }
    return false;
  }
}
