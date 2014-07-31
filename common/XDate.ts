/*
  Local time handling and formatting.
*/
module Esper.XDate {
  export function copy(d : Date) : Date {
    return new Date(d.getTime());
  }

  export function ofString(s : string) : Date {
    return new Date(s);
  }

  export function toString(d : Date) : string {
    return d.toISOString();
  }

  export function now() : number {
    return Date.now();
  }

  export function year(d : Date) : number {
    return d.getUTCFullYear();
  }

  /* 1-12 */
  export function monthNumber(d : Date) : number {
    return d.getUTCMonth() + 1;
  }

  /* 1-31 */
  export function day(d : Date) : number {
    return d.getUTCDate();
  }

  /* 0-23 */
  export function hours(d : Date) : number {
    return d.getUTCHours();
  }

  /* 0-59 */
  export function minutes(d : Date) : number {
    return d.getUTCMinutes();
  }

  /* 0-59 */
  export function seconds(d : Date) : number {
    return d.getUTCSeconds();
  }

  function pad(s : string) : string {
    if (s.length >= 2)
      return s;
    else
      return "0" + s;
  }

  var weekDays =
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* "Mon", "Tue", ... */
  export function weekDay(d : Date) : string {
    return weekDays[d.getUTCDay()];
  }

  var months =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* "Jan", "Feb", ... */
  export function month(d : Date) : string {
    return months[d.getUTCMonth()];
  }

  /* "Aug 13" */
  export function dateOnlyWithoutYear(d : Date) : string {
    return month(d)
      + " " + day(d).toString();
  }

  /* "Aug 13, 2019" */
  export function dateOnly(d : Date) : string {
    return month(d)
      + " " + day(d).toString()
      + ", " + year(d).toString();
  }

  /* "1:30 pm" */
  function formatTimeOnly(hour, min) {
    var ampm;
    var h;
    if (hour < 12) {
      h = 0 < hour ? hour : 12;
      ampm = "am";
    } else {
      h = 12 < hour ? hour - 12 : 12;
      ampm = "pm";
    }
    return h.toString() + ":" + pad(min.toString()) + " " + ampm;
  }

  export function timeOnly(d : Date) : string {
    return formatTimeOnly(hours(d), minutes(d));
  }

  export function utcToLocalTimeOnly(d : Date) : string {
    return formatTimeOnly(d.getHours(), d.getMinutes());
  }

  /* "Wed Aug 13, 2019 from 12:30pm to 1:30 pm" */
  export function range(d1 : Date, d2 : Date) : string {
  return /*weekDay(d1) +" "+*/ dateOnly(d1) +
      " from "+ timeOnly(d1) +" to "+ timeOnly(d2);
  }

  /* "12:30pm to 1:30 pm" */
  export function hourRange(d1 : Date, d2 : Date) : string {
    return utcToLocalTimeOnly(d1) +" to "+ utcToLocalTimeOnly(d2);
  }

  /* "Wed Aug 13, 2019 at 12:30pm" */
  export function justStartTime(d1 : Date) : string {
    return weekDay(d1) +" "+ dateOnly(d1) +
      " at "+ timeOnly(d1);
  }
}
