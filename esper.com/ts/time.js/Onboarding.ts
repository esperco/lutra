/*
  Module to manage onboarding process
*/

/// <reference path="../lib/Stores.Teams.ts" />

module Esper.Onboarding {

  // Does user need to hook up calendars?
  export function needsCalendars() {
    var teamWithCal = _.find(Stores.Teams.all(), (t) => {
      var teamReady = Stores.Teams.status(t.teamid).match({
        none: () => false,
        some: (m) => m === Model2.DataStatus.READY
      });
      if (! teamReady) return false;

      var cals = Option.cast(Calendars.CalendarListStore.val(t.teamid));
      return cals.match({
        none: () => false,
        some: (s) => s.length > 0
      });
    });
    return !teamWithCal;
  }
}
