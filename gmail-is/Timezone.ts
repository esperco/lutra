/*
  Timezone date-time conversions
*/
module Esper.Timezone {

  /* Given an ISO 8601 timestamp in local time (without timezone info),
     assume its timezone is fromTZ (the calendar zone)
     and apply the necessary changes to express it in toTZ (display zone).
  */
  export function shiftTime(timestamp: string,
                            fromTZ: string,
                            toTZ: string) {
    var local = timestamp.replace(/Z$/, "");
    var inCalendarTZ =
      /UTC$/.test(fromTZ) || /GMT$/.test(fromTZ) ?
      (<any> moment).utc(local) :
      (<any> moment).tz(local, fromTZ);
    var inDisplayTZ =
      /UTC$/.test(toTZ) || /GMT$/.test(toTZ) ?
      (<any> inCalendarTZ.utc()) :
      (<any> inCalendarTZ).tz(toTZ);
    return (<any> inDisplayTZ).format();
  }
}
