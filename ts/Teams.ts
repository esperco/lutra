/*
  Helpers for getting and setting current team info
*/

/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />

module Esper.Teams {
  export var teamStore = new Model.CappedStore<ApiT.Team>();
  export var allTeamsStore = new Model.BatchStore(teamStore, 1);
  var batchKey = "";

  export function get(teamId: string): ApiT.Team {
    return teamStore.val(teamId);
  }

  export function dataStatus(teamId: string): Model.DataStatus {
    var meta = teamStore.metadata(teamId);
    return meta && meta.dataStatus;
  }

  export function first(): ApiT.Team {
    return all()[0];
  }

  export function all(): ApiT.Team[] {
    return allTeamsStore.batchVal(batchKey) || [];
  }

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    var tuples = _.map(loginResponse.teams,
      (t): [string, ApiT.Team] => [t.teamid, t]
    );
    allTeamsStore.batchUpsert(batchKey, tuples);
  }

  export function init() {
    Login.loginPromise.done(loadFromLoginInfo);
  }
}
