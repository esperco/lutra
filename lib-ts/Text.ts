/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {
  // Basics
  export const Label = "Goal";
  export const Labels = "Goals";

  // Label interface
  export const AddLabel = "Add " + Label;
  export function predictionTooltip(score: number) { // Score is 0-1
    return `We are ${Util.roundStr(score * 100, 0)}% confident that this ` +
           `${Label.toLowerCase()} is applicable to this event`;
  }

  export const DefaultErrorTooltip = `There was an error connecting to the ` +
    `server. Try refreshing or contacting us at https://esper.com/contact`;
}
