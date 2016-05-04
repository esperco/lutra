/*
  Helpers for getting and setting current team info
*/

/// <reference path="../lib/Model.Batch.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="../lib/Save.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../lib/Login.Web.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Teams {
  export var teamStore = new Model.CappedStore<ApiT.Team>();
  export var allTeamsStore = new Model.BatchStore(teamStore, 1);
  var batchKey = "";

  export function get(teamId: string): ApiT.Team {
    return teamStore.val(teamId);
  }

  // Like get, but logs error if team doe not exist
  export function require(teamId: string) {
    var team = get(teamId);
    if (! team) {
      Log.e("Teams.require called with non-existent team - " + teamId);
      teamStore.upsertSafe(teamId, null, {
        dataStatus: Model.DataStatus.PUSH_ERROR
      });
    }
    return team;
  }

  export function dataStatus(teamId: string): Model.DataStatus {
    var meta = teamStore.metadata(teamId);
    return meta && meta.dataStatus;
  }

  export function first(): ApiT.Team {
    return all()[0];
  }

  export function firstId(): string {
    var _ids = allIds();
    return _ids && _ids[0];
  }

  export function all(): ApiT.Team[] {
    return allTeamsStore.batchVal(batchKey) || [];
  }

  export function allIds(): string[] {
    return allTeamsStore.val(batchKey);
  }

  export function allPairs(): [ApiT.Team, Model.StoreMetadata][] {
    return allTeamsStore.batchGet(batchKey) || [];
  }

  export function upsertTeam(team: ApiT.Team): string {
    teamStore.upsertSafe(team.teamid, team, {
      dataStatus: Model.DataStatus.UNSAVED
    });

    var currentTeamIds = _.clone(allTeamsStore.val(batchKey)) || [];
    currentTeamIds.push(team.teamid);
    currentTeamIds = _.uniq(currentTeamIds);
    allTeamsStore.upsertSafe(batchKey, currentTeamIds);

    return team.teamid;
  }

  // Create a new team for an executive
  function create(req: ApiT.TeamCreationRequest) {
    var p = Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        upsertTeam(t);
        setDefaultLabels(t.teamid);
      }
      return t;
    });
    Save.monitor(teamStore, "new-team", p);
    return p;
  }

  var defaultTeamDfd: JQueryDeferred<ApiT.Team> = $.Deferred();
  export var defaultTeamPromise = defaultTeamDfd.promise();

  function setDefaultTeam() {
    var info = Login.InfoStore.val();
    var defaultTeam = _.find(info.teams,
      (t) => t.team_executive === Login.myUid()
    );
    if (defaultTeam) {
      defaultTeamDfd.resolve(defaultTeam);
    } else {
      createExecTeam(info.email).done((t) => defaultTeamDfd.resolve(t));
    }
  }

  export function createExecTeam(email: string) {
    return create({
      executive_name: email,
      executive_email: email
    });
  }


  //////////

  // Add and remove exact, display versions of labels

  export function addLabel(_id: string, label: string) {
    return applyLabels(_id, [], [label]);
  }

  export function rmLabel(_id: string, label: string) {
    return applyLabels(_id, [label], []);
  }

  export function renameLabel(_id: string, oldLabel: string, newLabel: string) {
    return applyLabels(_id, [oldLabel], [newLabel]);
  }

  // Find the normalized form of a team label
  export function getNormLabel(label: string) {
    var teams = Teams.all();
    for (let i in teams) {
      var team = teams[i];

      for (let j in team.team_labels) {
        if (team.team_labels[j] === label) {
          return team.team_labels_norm[j];
        }
      }
    }

    // No match, default to lowercase and trimming
    return label.toLowerCase().trim();
  }

  function setDefaultLabels(_id: string) {
    var team = require(_id);
    if (! team) {
      throw new Error("No team in setDefaultLabels");
    }

    if (! team.team_labels.length) {
      applyLabels(_id, Labels.DEFAULTS, []);
    }
  }

  function applyLabels(_id: string, rmLabels: string[], addLabels: string[]) {
    var team = require(_id);
    if (! team) return;

    var newLabels = _.filter(team.team_labels, (l) => !_.includes(rmLabels, l));
    newLabels = newLabels.concat(addLabels);

    // Remove duplicates based on normalization
    newLabels = _.uniqBy(newLabels, getNormLabel);

    return setTeamLabels(_id, team, newLabels);
  }

  function setTeamLabels(_id: string, team: ApiT.Team, labels: string[]) {
    // Store values immutable so clone
    var teamCopy = _.cloneDeep(team);

    /*
      Alphabetize when setting labels (better performance to sort now
      than in the gajillion places where we pull a list of team labels)
    */
    labels = _.sortBy(labels, Labels.normalizeForSort);

    teamCopy.team_labels = labels;
    teamCopy.team_labels_norm = _.map(labels, getNormLabel);
    nextLabelUpdates[_id] = labels;

    /*
      Prepend team-label- because we only want to be blocking on team label
      updates, not any object with this teamid
    */
    var p = Queue.enqueue("team-label-" + _id, () => {
      var labels = nextLabelUpdates[_id];
      if (labels) {
        var teamId = team.teamid || _id;

        delete nextLabelUpdates[_id];
        Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
          numLabels: labels.length,
          _id: teamId,
          teamName: team.team_name,
          labels: labels
        });

        return Api.putSyncedLabels(team.teamid, { labels: labels });
      }
    });

    teamStore.push(_id, p, teamCopy);
    return p;
  }

  // Track pending label updates for team
  var nextLabelUpdates: {
    [index: string]: string[]
  } = {};


  /////

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    var tuples = _.map(loginResponse.teams,
      (t): [string, ApiT.Team] => [t.teamid, t]
    );
    allTeamsStore.batchUpsert(batchKey, tuples);
    _.each(allIds(), setDefaultLabels);
    setDefaultTeam();
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
