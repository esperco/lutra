/*
  Helpers for getting current calendar
*/

/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />

module Esper.Calendars {
  export function get(teamId: string, calId: string) {
    var team = Teams.get(teamId);
    if (team) {
      return _.find(team.team_calendars, (cal) => getId(cal) === calId);
    }
  }

  // Extract ID for calendar -- refactored into function because this may
  // change -- i.e. when we bring in Nylas integration, need to use key other
  // than google_cal_id
  export function getId(cal: ApiT.Calendar) {
    return cal.google_cal_id;
  }
}
