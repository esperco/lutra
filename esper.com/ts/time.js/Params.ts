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
    return _.omitBy({
      sun: dayHourJSON(weekHours.sun),
      mon: dayHourJSON(weekHours.mon),
      tue: dayHourJSON(weekHours.tue),
      wed: dayHourJSON(weekHours.wed),
      thu: dayHourJSON(weekHours.thu),
      fri: dayHourJSON(weekHours.fri),
      sat: dayHourJSON(weekHours.sat)
    }, (v) => !v)
  }

  function dayHourJSON(o: Option.T<Types.DayHours>) {
    return o.match({
      none: () => null,
      some: (dh) => _.isEqual(dh, allDay) ? dh : null
    });
  }

  export function cleanWeekHours(weekHours: Types.WeekHours) {
    weekHours = weekHours || weekHoursAll();
    weekHours.sun = cleanDayHoursOpt(weekHours.sun);
    weekHours.mon = cleanDayHoursOpt(weekHours.mon);
    weekHours.tue = cleanDayHoursOpt(weekHours.tue);
    weekHours.wed = cleanDayHoursOpt(weekHours.wed);
    weekHours.thu = cleanDayHoursOpt(weekHours.thu);
    weekHours.fri = cleanDayHoursOpt(weekHours.fri);
    weekHours.sat = cleanDayHoursOpt(weekHours.sat);
    return weekHours;
  }

  export function cleanDayHoursOpt(o: Option.T<Types.DayHours>) {
    o = Option.cast(o);
    return o.flatMap((dayHours) => Option.cast(cleanDayHours(dayHours)));
  }

  export function cleanDayHours(dayHours?: Types.DayHours) {
    dayHours = dayHours || {
      start: { hour: 0, minute: 0 },
      end: { hour: 24, minute: 0}
    };
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
