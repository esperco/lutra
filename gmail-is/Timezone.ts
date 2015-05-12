/*
  Timezone date-time conversions
*/
module Esper.Timezone {

  /* Given an ISO 8601 timestamp in local time (without timezone info),
     assume its timezone is fromTZ (the calendar zone)
     and apply the necessary changes to express it in toTZ (display zone).
     Returns an ISO 8601 timestamp without timezone info.
  */
  export function shiftTime(timestamp: string,
                            fromTZ: string,
                            toTZ: string): string {

    // 2015-05-08T23:00:00.000Z -> 2015-05-08T23:00:00.000
    var local = timestamp.replace(/Z$/, "");

    var inCalendarTZ =
      /UTC$/.test(fromTZ) || /GMT$/.test(fromTZ) ?
      (<any> moment).utc(local) :
      (<any> moment).tz(local, fromTZ);

    var inDisplayTZ =
      /UTC$/.test(toTZ) || /GMT$/.test(toTZ) ?
      (<any> inCalendarTZ.utc()) :
      (<any> inCalendarTZ).tz(toTZ);

    var fullTimestamp = (<any> inDisplayTZ).format();

    // 2015-05-09T12:00:00.000+03:00 -> 2015-05-09T12:00:00.000
    var localTimestamp =
      fullTimestamp.replace(/([+-][0-9][0-9]:[0-9][0-9]|[A-Z]+)$/, "");

    return localTimestamp;
  }
}
