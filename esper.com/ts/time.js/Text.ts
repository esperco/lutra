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

  export const LabelSetupHeading = "Set Some Goals";
  export const LabelSetupSelfDescription = "What do you want to spend more " +
    "time on? We'll use these to categorize your calendar events and " +
    "calculate how much time you're spending towards each goal.";
  export const LabelSetupExecDescription = "Pick some goals for each person " +
    "you're supporting. We'll use these to categorize their calendar " +
    "events and calculate how much time they're spending towards each goal.";

  export const LabelProfiles: {
    name: string;
    labels: string[];
  }[] = [{
    name: "Senior Leadership",
    labels: [
      "Direct Reports",
      "Investors",
      "Customers and Partners",
      "Recruiting",
      "Strategy",
      "Email & Communication",
      "Health and Wellness",
      "Impromptu Interactions",
      "Misc. Obligations"
    ]
  }, {
    name: "Sales",
    labels: [
      "Lead Generation",
      "Sales Development",
      "Customer Success"
    ]
  }, {
    name: "Management",
    labels: [
      "Direct Reports",
      "Higher Ups",
      "External",
      "Team Development",
      "Recruiting",
      "Health and Wellness",
      "Misc. Obligations"
    ]
  }, {
    name: "Lifestyle",
    labels: [
      "Family",
      "Friends",
      "Health and Wellness",
      "Personal Development",
      "Work"
    ]
  }, {
    name: "Custom",
    labels: []
  }]

  export const CalendarSetupHeading = "Hook Up Your Calendar";
  export const CalendarSetupSelfDescription = "Which calendars do you want " +
    "connect to Esper?"
  export const CalendarSetupExecDescription = "Pick which calendars Esper " +
    "should use for each person you're supporting.";

  // For post-meeting feedback
  export const FeedbackTitle  = "Meeting Feedback"
  export const NoAttendPast   = "Ignore";
  export const NoAttendFuture = "Ignore";
  export const NoEventTitle = `Untitled Event`;

  // Selector text
  export const AllLabels = `All ` + _.capitalize(Labels);
  export const Unlabeled = `No ${_.capitalize(Label)} Assigned`;
  export const Unconfirmed = `New Events`;
  export const ManageLabels = `Manage ${_.capitalize(Labels)}`;
  export const SearchEventsPlaceholder = `Search Events`;

  // Paginated Predictions
  export const ConfirmLabelsHeading = Unconfirmed;
  export const ConfirmationDescription = `Hi there! We've made some guesses ` +
    `about which ${Labels} to apply to your events. Help us out by ` +
    `confirming changing those guesses below.`;
  export const MorePredictions = `More`;
  export const PredictionsLoading = `Updating ` + _.capitalize(Labels);
  export const ConfirmAllLabels = `Confirm All`;
  export const ConfirmationDone = `Thanks! That's all for now.`;

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

  export function eventTitleForChart(event: Stores.Events.TeamEvent) {
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
