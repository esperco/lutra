/*
  Module to manage onboarding process
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Route.tsx" />

module Esper.Onboarding {
  export var paths = [
    "onboarding/start",
    "onboarding/add-cals",
    "onboarding/add-labels",
    "onboarding/label-events",
    "onboarding/charts"
  ];

  // Go to previous step in onboarding
  export function prev() {
    var prev = paths[current() - 1];
    if (prev) {
      Route.nav.path(prev);
    }
  }

  // Go to next step in onboarding
  export function next() {
    var next = paths[current() + 1];
    if (next) {
      Route.nav.path(next);
    } else {
      finalize();
    }
  }

  function finalize() {
    Route.nav.path("calendar-labeling");
  }

  // Get current step in onboarding (0-based index)
  export function current() {
    return _.findIndex(paths, Route.nav.isActive);
  }

  // Are we allowed to go to the next step?
  export function canGoToNext() {
    return completedSoFar() + 1 > current();
  }

  // Should we launch onboarding?
  export function required() {
    /*
      Only if no team or labels -- we could check to see if events are labeled
      but that's hard to do without fetching a whole lot of events
    */
    return completedSoFar() < 2;
  }

  /*
    Simple counter for how many events have been labeled in the current
    session
  */
  var eventsLabeled = new Model.StoreOne<number>();
  export function incrLabeled() {
    eventsLabeled.set(function(old: number) {
      old = old || 0;
      return old + 1;
    });
  }

  // How many onboarding steps have been completed so far?
  function completedSoFar() {
    var teams = Teams.all();
    if (! teams.length) {
      teams = Login.InfoStore.val().teams;
    }

    // Step 1 => Create team with calendar
    var teamWithCal = _.find(teams,
      (t) => t.team_calendars && t.team_calendars.length
    );
    if (! teamWithCal) {
      return 0;
    }

    // Step 2 => Add some labels
    var teamWithLabels = _.find(teams,
      (t) => t.team_labels && t.team_labels.length > 1
    );
    if (! teamWithLabels) {
      return 1;
    }

    // Step 3 => Label some events
    if (! eventsLabeled.val()) {
      return 2;
    }

    // Else, everything is copacetic
    return paths.length + 1;
  }
}
