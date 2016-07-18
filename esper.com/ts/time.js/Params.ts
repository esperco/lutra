module Esper.Params{

  export function weekHoursAll() {
    let all = Option.some({
      start: { hour: 0, minute: 0 },
      end: { hour: 24, minute: 0 }
    });
    return {
      sun: all,
      mon: all,
      tue: all,
      wed: all,
      thu: all,
      fri: all,
      sat: all
    };
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
