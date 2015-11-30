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
        Calendars.calendarListStore.alias(_id, t.teamid);
      }
      return t;
    });
  }

  export function getDefaultTeamId(): string {
    var pair = _.find(teamStore.getAll(), (p) => !p[0].teamid);
    return pair && pair[1]._id;
  }

  // Takes a comma-separated set of labels to add
  export function addLabels(teamId: string, commaSeparatedLabels: string) {
    var team = get(teamId);
    if (! team) {
      Log.e("addLabels called with non-existent team - " + teamId);
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
    return setTeamLabels(team, labels);
  }

  export function rmLabels(teamId: string, commaSeparatedLabels: string) {
    var team = get(teamId);
    if (! team) {
      Log.e("rmLabels called with non-existent team - " + teamId);
      return;
    }

    var rmLabels: string[] = commaSeparatedLabels.split(",");
    var newLabels: string[] = _.filter(team.team_labels || [],
      (l) => !_.find(rmLabels,
        (rmL) => normalizeLabel(l) === normalizeLabel(rmL)
      )
    );

    return setTeamLabels(team, newLabels);
  }

  function setTeamLabels(team: ApiT.Team, labels: string[]) {
    /*
      NB: By using teamid instead of an alternate, we assume that we are only
      setting labels on existing teams, not new ones created by our
      defaultTeam functions above.
    */
    var teamId = team.teamid;

    var teamCopy = _.cloneDeep(team); // Store values immutable so clone
    teamCopy.team_labels = labels;
    nextLabelUpdates[teamId] = labels;

    /*
      Prepend team-label- because we only want to be blocking on team label
      updates, not any object with this teamid
    */
    var p = Queue.enqueue("team-label-" + teamId, () => {
      var labels = nextLabelUpdates[teamId];
      if (labels) {
        delete nextLabelUpdates[teamId];
        Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
          numLabels: labels.length,
          teamId: team.teamid,
          teamName: team.team_name,
          labels: labels
        });
        return Api.putSyncedLabels(team.teamid, { labels: labels })
      }
    });

    teamStore.push(teamId, p, teamCopy);
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
  }

  export function init() {
    Login.loginPromise.done(loadFromLoginInfo);
  }
}
