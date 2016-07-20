module Esper.Params{

  let allDay = {
    start: { hour: 0, minute: 0 },
    end: { hour: 24, minute: 0 }
  };

  export function weekHoursAll() {
    let optAll = Option.some(allDay);
    return {
      sun: optAll,
      mon: optAll,
      tue: optAll,
      wed: optAll,
      thu: optAll,
      fri: optAll,
      sat: optAll
    };
  }

  export function weekHoursJSON(weekHours: Types.WeekHours) {
    let ret = _.omitBy({
      sun: dayHourJSON(weekHours.sun),
      mon: dayHourJSON(weekHours.mon),
      tue: dayHourJSON(weekHours.tue),
      wed: dayHourJSON(weekHours.wed),
      thu: dayHourJSON(weekHours.thu),
      fri: dayHourJSON(weekHours.fri),
      sat: dayHourJSON(weekHours.sat)
    }, (v) => !v)
    return ret;
  }

  function dayHourJSON(o: Option.T<Types.DayHours>) {
    return o.match({
      none: () => null,
      some: (dh) => _.isEqual(dh, allDay) ? {} : dh
    });
  }

  export function cleanWeekHours(weekHours: Types.WeekHours) {
    return WeekHours.map(weekHours || weekHoursAll(),
      (v,k) => cleanDayHoursOpt(v));
  }

  export function cleanDayHoursOpt(o: Option.T<Types.DayHours>) {
    o = Option.cast(o);
    return o.flatMap((dayHours) => Option.cast(cleanDayHours(dayHours)));
  }

  export function cleanDayHours(dayHours?: Types.DayHours) {
    dayHours = (dayHours && dayHours.start && dayHours.end) ? dayHours : allDay;
    dayHours.start = cleanHourMinute(dayHours.start);
    dayHours.end = cleanHourMinute(dayHours.end);
    return dayHours;
  }

  export function cleanHourMinute(hourMinute?: ApiT.HourMinute) {
    hourMinute = hourMinute || { hour: 0, minute: 0 };
    if (!_.isNumber(hourMinute.hour) ||
        hourMinute.hour < 0 && hourMinute.hour > 24) {
      return { hour: 0, minute: 0 };
    }

    if (hourMinute.hour === 24) { hourMinute.minute = 0; }
    if (hourMinute.minute < 0) { hourMinute.minute = 0; }
    else if (hourMinute.minute > 59) { hourMinute.minute = 59; }

    return hourMinute;
  }
}
