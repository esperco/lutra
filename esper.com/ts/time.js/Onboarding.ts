/*
  Module to manage onboarding process
*/

/// <reference path="../lib/Stores.Calendars.ts" />
/// <reference path="../lib/Stores.Teams.ts" />

module Esper.Onboarding {

  export function needsTeam() {
    return _.isEmpty(Stores.Teams.all());
  }

  export function needsLabels() {
    return needsTeam() || !!_.find(Stores.Teams.all(), (t) =>
      t.team_labels.length === 0
    );
  }

  // Does user need to hook up calendars?
  export function needsCalendars() {
    var teamWithoutCal = _.find(Stores.Teams.all(), (t) => {
      var cals = Stores.Calendars.list(t.teamid);
      return cals.match({
        none: () => true,
        some: (s) => s.length === 0
      });
    });
    return needsTeam() || !!teamWithoutCal;
  }
}
