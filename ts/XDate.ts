/*
  Local time handling and formatting.
*/
module XDate {
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

  var fullWeekDays =
    ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  /* "Monday", "Tuesday", ... */
  export function fullWeekDay(d : Date) : string {
    return fullWeekDays[d.getUTCDay()];
  }

  var months =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* "Jan", "Feb", ... */
  export function month(d : Date) : string {
    return months[d.getUTCMonth()];
  }

  var fullMonths =
    ["January", "February", "March", "April", "May", "June",
     "July", "August", "September", "October", "November", "December"];

  /* "January", "February", ... */
  export function fullMonth(d : Date) : string {
    return fullMonths[d.getUTCMonth()];
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

  export function fullMonthDay(d : Date) : string {
    return fullMonth(d) + " " + day(d).toString();
  }

  /* "1:30pm" */
  export function formatTimeOnly(hour, min, short, spacer = "") {
    var ampm;
    var h;
    if (hour < 12) {
      h = 0 < hour ? hour : 12;
      ampm = "am";
    } else {
      h = 12 < hour ? hour - 12 : 12;
      ampm = "pm";
    }
    var colonMin =
      short && min === 0 ?
      "" :
      ":" + pad(min.toString());
    return h.toString() + colonMin + spacer + ampm;
  }

  export function timeOnly(d : Date) : string {
    return formatTimeOnly(hours(d), minutes(d), false);
  }

  export function shortTimeOnly(d : Date) : string {
    return formatTimeOnly(hours(d), minutes(d), true);
  }

  export function utcToLocalTimeOnly(d : Date) : string {
    return formatTimeOnly(d.getHours(), d.getMinutes(), false);
  }

  /* "August 13, 12:30-1pm" */
  export function range(d1 : Date, d2 : Date) : string {
    var t1 = shortTimeOnly(d1);
    var t2 = shortTimeOnly(d2);
    if (t1.slice(-2) === t2.slice(-2)) // both am or both pm
      t1 = t1.slice(0, -2);
    return fullMonthDay(d1) + ", " + t1 + "-" + t2;
  }

  /* "12:30pm to 1:30 pm" */
  export function hourRange(d1 : Date, d2 : Date) : string {
    return utcToLocalTimeOnly(d1) +" to "+ utcToLocalTimeOnly(d2);
  }

  /* "August 13 at 12:30 pm" */
  export function justStartTime(d1 : Date) : string {
    return fullMonthDay(d1) + " at " +
      formatTimeOnly(hours(d1), minutes(d1), false, " ");
  }

  export function timeWithoutYear(d1 : Date) : string {
    return weekDay(d1) + " " + dateOnlyWithoutYear(d1) +
      " at " + timeOnly(d1);
  }
}
