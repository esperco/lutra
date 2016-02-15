/*
  Module to manage onboarding process
*/

/// <reference path="./Teams.ts" />

module Esper.Onboarding {

  // Does user need to hook up calendars?
  export function needsCalendars() {
    var teamWithCal = _.find(Teams.all(), (t) => {
      var cals = Option.cast(Calendars.CalendarListStore.val(t.teamid));
      return cals.match({
        none: () => false,
        some: (s) => s.length > 0
      });
    });
    return !teamWithCal;
  }

  export function needsLabels() {
    var teamWithLabels = _.find(Teams.all(),
      (t) => t.team_labels && t.team_labels.length > 0
    );
    return !teamWithLabels;
  }

}
