/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {

  function s(n: number) {
    return n != 1 ? 's' : '';
  }

  export function hours(n: number) {
    return `${Util.roundStr(n, 2)} hour${s(n)}`;
  }

  export function hoursUnit(n: number) {
    return `hour${s(n)}`;
  }

  export function events(n: number) {
    return `${n} event${s(n)}`;
  }

  export function eventsUnit(n: number) {
    return `event${s(n)}`;
  }

  export function eventTitleForChart(event: Events2.TeamEvent) {
    return `${event.title} (${date(event.start)})`;
  }

  export function date(d: Date|moment.Moment|string) {
    return moment(d).format("MMM D");
  }

  export function datePlusDay(d: Date|moment.Moment|string) {
    return moment(d).format("MMM D - dddd");
  }

  export function time(d: Date|moment.Moment|string) {
    return moment(d).format("h:mm a");
  }

  export function fmtPeriod(p: Period.Single|Period.Custom) {
    var bounds = Period.boundsFromPeriod(p);
    var start = bounds[0];
    switch(p.interval) {
      case "quarter":
        return moment(start).format("[Q]Q YYYY");
      case "month":
        return moment(start).format("MMMM YYYY");
      case "week":
        return moment(start).format("[Week of] MMM D");
      default: // Custom
        var end = bounds[1];
        return `${date(start)} - ${date(end)}`;
    }
  }
}
