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

  export const LabelSetupHeading = `Pick Some ${_.capitalize(Labels)}`;
  export const LabelSetupSelfDescription = "What do you want to prioritize? " +
    "We'll use these to categorize your calendar events and " +
    "calculate how much time you're spending towards each priority.";
  export const LabelSetupExecDescription = `Pick some ${Labels} for each ` +
    "person you're supporting. We'll use these to categorize their calendar " +
    "events and calculate how much time they're spending towards each " +
    "priority.";

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

  // Selector text
  export const SelectAll = `Select All`;
  export const AllLabels = `All ` + _.capitalize(Labels);
  export const Unlabeled = `No ${_.capitalize(Label)} Assigned`;
  export const Unconfirmed = `New Events`;
  export const SearchEventsPlaceholder = `Filter Events`;

  export const GuestDomains = `Organizations`;
  export const NoGuests = `No Guests`;
  export const NoTeam = `Select ${TeamExec}`;
  export const ManageTeams = `Manage ${TeamExecs}`;

  export const NoRating = `No Rating`;
  export const WeekHours = `Time of Day`;
  export const IncUnscheduled = `Show Unscheduled Time`;

  // Period selector text
  export const Week = `Week`;
  export const Month = `Month`;
  export const Quarter = `Quarter`;
  export const Custom = `Custom`;

  // Paginated Predictions
  export const ConfirmLabelsHeading = Unconfirmed;
  export const ConfirmationDescription = `Hi there! We've made some guesses ` +
    `about which ${Labels} to apply to your events. Help us out by ` +
    `confirming changing those guesses below.`;
  export const PredictionsLoading = `Updating ` + _.capitalize(Labels);
  export const ConfirmAllLabels = `Confirm ${_.capitalize(Labels)}`;

  // Chart Types
  export const ChartPercentage = `Percent`;
  export const ChartAbsolute = `Absolute Time`;
  export const ChartGrid = `Calendar Grid`;

  // Chart Units
  export const ChartPercentUnit = `Percent`;
  export const ChartHoursUnit = `Hours`;

  // Chart messages
  export const ChartNoData = `No events found`;
  export const ChartFetching = `Fetching data from your calendar`;
  export const ChartFetchError = `Error loading data. ` +
    `Try refreshing in a few minutes.`;
  export const ChartCalculating = `Crunching numbers`;

  // Chart groupings
  export const ChartDuration = `Duration`;
  export const ChartLabels = _.capitalize(Labels);
  export const ChartGuests = _.capitalize(Guests);
  export const ChartGuestsCount = `Number of Attendees`;
  export const ChartCalendars = `Calendars`;
  export const ChartRatings = `Ratings`

  // Chart descriptions
  export const ChartCalendarsDescription =
    `You have more than one calendar hooked up to Esper. We've grouped your ` +
    `events by which calendar they're on. This can be helpful for tracking ` +
    `how much time you spend on personal vs. work-related events.`;
  export const ChartDurationDescription =
    `We've grouped your events by how long they are. If you need to touch ` +
    `base with many different ${Guests}, it may help to schedule shorter ` +
    `meetings.`;
  export const ChartLabelsDescription =
    `You can add ${Labels} to your events to ` +
    `categorize them and see what you're spending the most time on.`;
  export const ChartGuestsDescription =
    `These are the people whom you spend the most time in meetings with.`;
  export const ChartDomainsDescription =
    `We've grouped the people you meet with by which organization their ` +
    `email address belongs to.`;
  export const ChartNoGuests =
    `None of these events have any ${Guests} invited.`;
  export const ChartGuestsCountDescription =
    `We've added up the number of ${Guests} invited to each meeting. ` +
    `Meetings with too many ${Guests} tend not be a productive use ` +
    `of everyone's time.`;
  export const ChartRatingsDescription =
    `Rate your meetings with Esper to help identify what kinds of ` +
    `meetings are helpful and what kinds aren't worth the time.`;

  /* Chart Misc */

  // Name for 0-value pseudo-event used for spacing
  export const ChartEmptyEvent = "No Events";

  // For showing unscheduled time if we've selected less than total
  export const ChartRemainder = "Unscheduled Time";

  /* Reports Misc */
  export const NotesHeading = "Meeting Notes";
  export const NotesDescription =
    `These are are the meeting notes you've taken during this time period.`;
  export const NoNotesMessage = <span>
    You don't have any meeting notes for this time period. You can add notes to
    events by clicking on them in the{" "}
    <a href={Paths.Time.list().href}>event list</a>.

    You can also take notes on your most recent event by visiting
    {" "}<a href={Paths.Now.home().href}>esper.com/now</a>{" or "}
    <a href={Paths.Manage.Team.notifications().href}>
      enabling email and Slack notifications
      in the settings page
    </a>.
  </span>;

  export const NoRatingsMessage = <span>
    You don't have any ratings for this time period. You can rate events
    by clicking on them in the{" "}
    <a href={Paths.Time.list().href}>event list</a>.

    You can also rate your most recent event by visiting
    {" "}<a href={Paths.Now.home().href}>esper.com/now</a>{" or "}
    <a href={Paths.Manage.Team.notifications().href}>
      enabling email and Slack notifications
      in the settings page
    </a>.
  </span>;

  export const SeeMoreLinkText = "See More Details";

  /////

  function s(n: number) {
    return n != 1 ? 's' : '';
  }

  export function hours(n?: number) {
    if (_.isUndefined(n)) { return 'hours'; }
    return `${Util.roundStr(n, 2)} hour${s(n)}`;
  }

  export function hoursOrMinutes(minutes: number) {
    if (minutes < 60) {
      minutes = Math.round(minutes)
      return `${minutes} minute${s(minutes)}`;
    }
    return hours(minutes / 60);
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

  export function stars(n: number) {
    return `${Util.roundStr(n, 1)} star${s(n)}`;
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
