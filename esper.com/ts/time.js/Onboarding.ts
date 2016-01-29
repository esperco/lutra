/*
  Module to manage onboarding process
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="../common/Login.ts" />
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

  // Change this to true to allow skipping
  export var canSkip = false;

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

  export function skip() {
    canSkip = true;
    Route.nav.path("charts");
  }

  // Get current step in onboarding (0-based index)
  export function current() {
    return _.findIndex(paths, Route.nav.isActive);
  }

  // Are we allowed to go to the next step?
  export function canGoToNext() {
    if (canSkip) { return true; }
    return completedSoFar() + 1 > current();
  }

  // Should we launch onboarding?
  export function required() {
    if (canSkip) { return false; }

    /*
      Only if no team or labels -- we could check to see if events are labeled
      but that's hard to do without fetching a whole lot of events
    */
    return completedSoFar() < 2;
  }

  // Number of events required to be labeled
  export var LABELS_REQUIRED = 5;

  // Function telling us how many more events need labeling
  export function labelsRequired() {
    var labeledEvents = _.filter(Events.EventStore.getAll(), (tuple) => {
      var data = tuple[0];
      var meta = tuple[1];
      return data && data.labels && data.labels.length && meta &&
        meta.dataStatus === Model.DataStatus.READY;
    });
    var labeledEventsCount = (labeledEvents && labeledEvents.length) || 0;
    return Math.max(LABELS_REQUIRED - labeledEventsCount, 0);
  }

  // How many onboarding steps have been completed so far?
  function completedSoFar() {
    var teams = Teams.all();
    if (! teams.length) {
      teams = Login.InfoStore.val().teams;
    }

    // Ignore teams being saved
    teams = _.filter(teams, (t) => {
      var meta = Teams.teamStore.metadata(t.teamid);
      return meta && meta.dataStatus === Model.DataStatus.READY;
    });

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
    if (labelsRequired() > 0) {
      return 2;
    }

    // Else, everything is copacetic
    return paths.length + 1;
  }
}
