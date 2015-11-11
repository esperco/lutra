/*
  Helpers for getting current team info
*/

/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />

module Esper.Teams {
  export function get(teamId: string): ApiT.Team {
    var loginInfo = Login.InfoStore.val();
    if (loginInfo) {
      return _.find(loginInfo.teams,
        (team) => team.teamid === teamId
      );
    }
  }

  export function all(): ApiT.Team[] {
    var loginInfo = Login.InfoStore.val();
    return (loginInfo && loginInfo.teams) || [];
  }
}
