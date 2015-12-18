/*
  Helpers for getting and setting current team info
*/

/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/Queue.ts" />
/// <reference path="../marten/ts/Util.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Calendars.ts" />

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

  export function allIds(): string[] {
    return allTeamsStore.val(batchKey);
  }

  /*
    Create an unsaved, default team for self-assisted user using loginInfo,
    stores it, and returns the _id the default team is stored under.
  */
  export function createDefaultTeam(loginInfo?: ApiT.LoginResponse): string {
    loginInfo = loginInfo || Login.InfoStore.val();
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

    return upsertTeam(team);
  }

  export function upsertTeam(team: ApiT.Team): string {
    var _id: string;
    if (team.teamid) {
      _id = team.teamid;
      teamStore.upsertSafe(_id, team, {
        dataStatus: Model.DataStatus.UNSAVED
      });
    } else {
      _id = Util.randomString();
      teamStore.insert(team, {
        _id: _id,
        dataStatus: Model.DataStatus.UNSAVED
      });
    }

    var currentTeamIds = _.clone(allTeamsStore.val(batchKey)) || [];
    currentTeamIds.push(_id);
    currentTeamIds = _.uniq(currentTeamIds);
    allTeamsStore.upsertSafe(batchKey, currentTeamIds);

    return _id;
  }

  // Save our default team
  export function saveDefaultTeam() {
    var _id = getDefaultTeamId();
    var team = _id && teamStore.val(_id);
    if (team &&
        teamStore.metadata(_id).dataStatus === Model.DataStatus.UNSAVED)
    {
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
        Calendars.CalendarListStore.alias(_id, t.teamid);
      }
      return t;
    });
  }

  // Saves a Nylas team for a given exec email
  export function saveNylasExecTeam(email: string) {
    var req: ApiT.TeamCreationRequest = {
      executive_name: email,
      executive_email: email
    };

    return Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        upsertTeam(t);
      }
      return t;
    });
  }

  export function getDefaultTeamId(): string {
    var pair = _.find(teamStore.getAll(),
      (p) => p[0].team_executive === Login.myUid()
    );
    return pair && pair[1]._id;
  }

  // Takes a comma-separated set of labels to add
  export function addLabels(_id: string, commaSeparatedLabels: string) {
    var team = get(_id);
    if (! team) {
      Log.e("addLabels called with non-existent team - " + _id);
      return;
    }

    var labels: string[] = commaSeparatedLabels.split(",");

    /*
      Trim prior to normalize because we want to display labels as entered
      minus extra spaces. Normalize doesn't mutate list -- it only uses
      case-insensitive comparison for removing duplicates
    */
    labels = _.map(labels, (l) => l.trim());

    labels = team.team_labels.concat(labels);
    labels = normalizeLabels(labels);
    return setTeamLabels(_id, team, labels);
  }

  export function rmLabels(_id: string, commaSeparatedLabels: string) {
    var team = get(_id);
    if (! team) {
      Log.e("rmLabels called with non-existent team - " + _id);
      return;
    }

    var rmLabels: string[] = commaSeparatedLabels.split(",");
    var newLabels: string[] = _.filter(team.team_labels || [],
      (l) => !_.find(rmLabels,
        (rmL) => normalizeLabel(l) === normalizeLabel(rmL)
      )
    );

    return setTeamLabels(_id, team, newLabels);
  }

  function setTeamLabels(_id: string, team: ApiT.Team, labels: string[]) {
    // Store values immutable so clone
    var teamCopy = _.cloneDeep(team);
    teamCopy.team_labels = labels;
    nextLabelUpdates[_id] = labels;

    /*
      Prepend team-label- because we only want to be blocking on team label
      updates, not any object with this teamid
    */
    var p = Queue.enqueue("team-label-" + _id, (t?: ApiT.Team) => {
      var labels = nextLabelUpdates[_id];
      if (labels) {
        var teamId = (t && t.teamid) || team.teamid;

        delete nextLabelUpdates[_id];
        Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
          numLabels: labels.length,
          _id: teamId,
          teamName: team.team_name,
          labels: labels
        });

        if (teamId) {
          return Api.putSyncedLabels(teamId, { labels: labels })
            .then(() => t || team);
        } else {
          return saveTeam(_id, team).then((t2: ApiT.Team) => {
            return Api.putSyncedLabels(t2.teamid, { labels: labels })
              .then(() => t2)
          });
        }
      }
    });

    teamStore.push(_id, p, teamCopy);
  }

  // Given a label list, remove duplicates and near-duplicates
  function normalizeLabels(labels: string[]) {
    labels = labels || [];
    return _.uniq(labels, normalizeLabel);
  }

  /*
    Helper for above -- use only for comparison purposes, not to actually
    clean up before setting on server -- we want to preserve user edits to
    some extent
  */
  function normalizeLabel(label: string) {
    var ret = label.trim().toLowerCase();
    return ret;
  }

  // Track pending label updates for team
  var nextLabelUpdates: {
    [index: string]: string[]
  } = {};

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    var tuples = _.map(loginResponse.teams,
      (t): [string, ApiT.Team] => [t.teamid, t]
    );
    allTeamsStore.batchUpsert(batchKey, tuples);

    // createDefaultTeam checks for existing team before creating, but we
    // should trigger for Nylas users and new users with no teams
    if (loginResponse.platform === "Nylas" ||
        !(loginResponse.teams && loginResponse.teams.length > 0)) {
      createDefaultTeam(loginResponse);
    }
  }

  export function init() {
    Login.onSuccess(loadFromLoginInfo);
  }
}
