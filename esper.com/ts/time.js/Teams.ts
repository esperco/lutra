/*
  Helpers for getting and setting current team info
*/

/// <reference path="../lib/Model.Batch.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="./Esper.ts" />
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
    return Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        upsertTeam(t);
      }
      return t;
    });
  }

  export var defaultTeamPromise: JQueryPromise<ApiT.Team>;

  function setDefaultTeam() {
    var info = Login.InfoStore.val();
    var defaultTeam = _.find(info.teams,
      (t) => t.team_executive === Login.myUid()
    );
    if (defaultTeam) {
      defaultTeamPromise = $.Deferred().resolve(defaultTeam);
    } else {
      defaultTeamPromise = createExecTeam(info.email);
    }
  }

  export function createExecTeam(email: string) {
    return create({
      executive_name: email,
      executive_email: email
    });
  }


  //////////

  // Takes a comma-separated set of labels to add
  export function addLabels(_id: string, commaSeparatedLabels: string) {
    return addRmLabels(_id, commaSeparatedLabels, "");
  }

  export function rmLabels(_id: string, commaSeparatedLabels: string) {
    return addRmLabels(_id, "", commaSeparatedLabels);
  }

  // Takes comma separated list of labels to add and remove
  export function addRmLabels(_id: string,
    addCommaSeparatedLabels: string, rmCommaSeparatedLabels: string)
  {
    var team = get(_id);
    if (! team) {
      Log.e("addRmLabels called with non-existent team - " + _id);
      teamStore.upsertSafe(_id, null, {
        dataStatus: Model.DataStatus.PUSH_ERROR
      });
      return;
    }

    var addLabels = Labels.toList(addCommaSeparatedLabels);
    var rmLabels = Labels.toList(rmCommaSeparatedLabels);

    /*
      Find index for first thing we're removing and insert there
      Use normalize, which doesn't mutate list but uses case-insensitive
      comparison for removing duplicates.
    */
    var index = -1;
    if (rmLabels.length) {
      index = _.findIndex(team.team_labels,
        (t) => Labels.normalize(t) === Labels.normalize(rmLabels[0])
      );
    }
    var newLabels: string[] = _.filter(team.team_labels,
      (l) => !_.find(rmLabels,
        (rmL) => Labels.normalize(l) === Labels.normalize(rmL)
      )
    );

    if (index > -1) {
      newLabels = newLabels.slice(0, index)
                    .concat(addLabels)
                    .concat(newLabels.slice(index));
    } else {
      newLabels = newLabels.concat(addLabels);
    }

    newLabels = normalizeLabels(newLabels);
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
  }

  // Given a label list, remove duplicates and near-duplicates
  function normalizeLabels(labels: string[]) {
    labels = labels || [];
    return _.filter(_.uniqBy(labels, Labels.normalize));
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
    setDefaultTeam();
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
