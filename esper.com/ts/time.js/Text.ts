/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {

  // Onboarding
  export const TeamSetupHeading = "Let's Get Started";
  export const TeamSetupDescription = "Welcome to Esper! Are you managing " +
    "time for just yourself or someone else (for instance, as an " +
    "assistant or supervisor)?";
  export const TeamSelfDescription = "Great! We need a little more info to " +
    "continue.";
  export const TeamExecDescription = "Fantastic. Who are you managing time " +
    "for? We'll invite that person to Esper and set things up " +
    "so that person can retain access to his or her Esper data if you " +
    "decide to hand off calendar duties to someone else."

  // For post-meeting feedback
  export const FeedbackTitle  = "Meeting Feedback"
  export const NoAttendPast   = "Didn't Attend";
  export const NoAttendFuture = "Won't Attend";

  // Label interface
  export const AddLabel = "Add Label";
  export function predictionTooltip(score: number) { // Score is 0-1
    score = score * 0.95; // Max => 95%
    return `We are ${Util.roundStr(score * 100, 0)}% confident that this ` +
           `label is applicable to this event`;
  }

  export const DefaultErrorTooltip = `There was an error connecting to the ` +
    `server. Try refreshing or contacting us at https://esper.com/contact`;

  export const NoEventTitle = `Untitled Event`;

  // Notification Settings
  export const GeneralPrefsHeading = "General Subscriptions";
  export const SendFeedbackEmail = "Email requesting meeting feedback";
  export const AddToDailyAgenda = "Included in daily agenda";
  export const SendLabelReminder =
    "Weekly emails reminding me to label calendar events";
  export const SendDailyAgenda = "Daily agenda email";
  export const SendFeedbackSummary =
    "Daily meeting feedback summary email";


  /////

  function s(n: number) {
    return n != 1 ? 's' : '';
  }

  export function hours(n: number) {
    return `${Util.roundStr(n, 2)} hour${s(n)}`;
  }

  export function hoursUnit(n: number) {
    return `hour${s(n)}`;
  }

  export function hoursShort(n: number) {
    return `${Util.roundStr(n, 1)}h`;
  }

  export function events(n: number) {
    return `${n} event${s(n)}`;
  }

  export function eventsUnit(n: number) {
    return `event${s(n)}`;
  }

  export function eventTitleForChart(event: Events2.TeamEvent) {
    return `${event.title || NoEventTitle} (${date(event.start)})`;
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

  export function fmtPeriod(p: Period.Single|Period.Custom, short?: boolean) {
    var bounds = Period.boundsFromPeriod(p);
    var start = bounds[0];
    switch(p.interval) {
      case "quarter":
        return moment(start).format(short ? "[Q]Q 'YY" : "[Q]Q YYYY");
      case "month":
        return moment(start).format(short ? "MMM" : "MMMM YYYY");
      case "week":
        return moment(start).format(short ? "MMM D" : "[Week of] MMM D");
      default: // Custom
        var end = bounds[1];
        return `${date(start)} - ${date(end)}`;
    }
  }

  export function fmtRelPeriod(interval: Period.Interval, incr: number) {
    var capInterval = _.capitalize(interval);
    if (incr === 0) {
      return "This " + capInterval;
    } else if (incr === -1) {
      return "Last " + capInterval;
    } else if (incr === 1) {
      return "Next " + capInterval;
    } else if (incr < -1) {
      return `In ${incr.toString()} ${capInterval}s`;
    } else { // Incr > 1
      return `${(-incr).toString()} ${capInterval}s Ago`;
    }
  }
}
