/*
  Helpers for getting and setting current team info
*/

/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/Util.ts" />
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

  /*
    Create an unsaved, default team for self-assisted user using loginInfo,
    stores it, and returns the _id the default team is stored under.
  */
  export function createDefaultTeam(): string {
    var loginInfo = Login.InfoStore.val();
    if (! loginInfo) {
      Log.e("Unabled to create default team. No login info.");
      return;
    }

    // If existing _id, use that
    var currentId = getDefaultTeamId();
    if (currentId) {
      return currentId;
    }

    var team: ApiT.Team = {
      teamid: "",
      team_name: loginInfo.email,
      team_approved: true,
      team_executive: loginInfo.uid,
      team_assistants: [loginInfo.uid],
      team_primary_assistant: loginInfo.uid,
      team_labels: [],
      team_label_urgent: "Urgent",
      team_label_new: "New",
      team_label_in_progress: "In Progress",
      team_label_pending: "Pending",
      team_label_done: "Done",
      team_label_canceled: "Canceled",
      team_calendars: [],
      team_email_aliases: [],
      team_calendar_accounts: []
    }

    var _id = Util.randomString();
    teamStore.insert(team, {
      _id: _id,
      dataStatus: Model.DataStatus.UNSAVED
    });

    var currentTeamIds = _.clone(allTeamsStore.val(batchKey)) || [];
    currentTeamIds.push(_id);
    allTeamsStore.upsertSafe(batchKey, currentTeamIds);

    return _id;
  }

  // Save our default team
  export function saveDefaultTeam() {
    var _id = getDefaultTeamId();
    var team = _id && teamStore.val(_id);
    if (team) {
      return saveTeam(_id, team);
    }
  }

  // Create a team given an unsaved team from the store
  export function saveTeam(_id: string, team: ApiT.Team) {
    var req: ApiT.TeamCreationRequest = {
      executive_name: team.team_name,
      team_calendars: team.team_calendars || []
    };

    return Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        teamStore.alias(_id, t.teamid);
      }
      return t;
    });
  }

  export function getDefaultTeamId(): string {
    var pair = _.find(teamStore.getAll(), (p) => !p[0].teamid);
    return pair && pair[1]._id;
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
