/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {
  // Label interface
  export const AddLabel = "Add Goal";
  export function predictionTooltip(score: number) { // Score is 0-1
    return `We are ${Util.roundStr(score * 100, 0)}% confident that this ` +
           `goal is applicable to this event`;
  }
}
