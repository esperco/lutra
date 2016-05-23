/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {
  // Basics
  export const Label = "goal";
  export const Labels = "goals";

  export const Calendar = "calendar";
  export const Calendars = "calendars";

  export const TeamExec = "principal";
  export const TeamExecs = "principals";

  // Label interface
  export const AddLabel = "add " + Label;
  export const FindAddLabels = "find / add " + Labels;
  export function predictionTooltip(score: number) { // Score is 0-1
    return `We are ${Util.roundStr(score * 100, 0)}% confident that this ` +
           `${Label.toLowerCase()} is applicable to this event`;
  }
  export const ConfirmLabels = "Confirm " + _.capitalize(Labels);

  // Calendar List
  export const NoCalendarError =
    "Please wait until calendars are available.";
  export const MustSelectCalendar =
    "Please select at least one calendar";

  export const DefaultErrorTooltip = `There was an error connecting to the ` +
    `server. Try refreshing or contacting us at https://esper.com/contact`;
}
