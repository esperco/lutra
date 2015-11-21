/*
  Module to manage onboarding process
*/

/// <reference path="./Components.Onboarding.tsx" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Login.ts" />

module Esper.Onboarding {
  function checkCals(loginInfo: ApiT.LoginResponse) {
    if (! _.find(loginInfo.teams,
                 (t) => t.team_calendars && t.team_calendars.length))
    {
      Layout.renderModal(
        React.createElement(Components.OnboardingCalModal)
      );
    }
  }

  export function init() {
    Login.loginPromise.done(checkCals);
  }
}
