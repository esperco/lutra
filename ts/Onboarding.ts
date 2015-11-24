/*
  Module to manage onboarding process
*/

/// <reference path="./Components.Onboarding.tsx" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Login.ts" />

module Esper.Onboarding {
  function renderCalModal() {
    Layout.renderModal(
      React.createElement(Components.OnboardingCalModal)
    );
  }

  function renderLabelModal() {
    Layout.renderModal(
      React.createElement(Components.OnboardingLabelModal)
    );
  }

  export function init() {
    Login.loginPromise.done(function(loginInfo) {
      var teamWithCal = _.find(loginInfo.teams,
        (t) => t.team_calendars && t.team_calendars.length
      );
      if (! teamWithCal) {
        renderCalModal();
        return;
      }

      var teamWithLabels = _.find(loginInfo.teams,
        (t) => t.team_labels && t.team_labels.length
      );
      if (! teamWithLabels) {
        renderLabelModal();
        return;
      }
    });
  }
}
