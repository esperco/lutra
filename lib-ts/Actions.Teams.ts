/*
  Refactored module for actions that create or alter teams
*/

/// <reference path="./Labels.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./Stores.Profiles.ts" />
/// <reference path="./Actions.TeamPreferences.ts" />

module Esper.Actions.Teams {

  /* Team Creation */

  export interface SelfTeamData {
    name: string;
    timezone: string;
  }

  export interface ExecTeamData extends SelfTeamData {
    email: string;
  }

  // Base team creation function
  function create(req: ApiT.TeamCreationRequest) {
    Analytics.track(Analytics.Trackable.CreateTeam, req);
    var p = Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        Stores.Teams.set(t);

        // New team => new prefs and exec
        Stores.TeamPreferences.reload();
        Stores.Profiles.reload();

        /*
          If team already existed prior to creation, it's possible values
          in create didn't stick. So make an update call too.

          TODO: Remove if/when creation call also puts.
        */
        updateTeam(t.teamid, {
          name: req.executive_name,
          timezone: req.executive_timezone
        });
      }
      return t;
    });
    Save.monitor(Stores.Teams.TeamStore, "new-team", p);
    return p;
  }

  /*
    Updates an existing team (doesn't allow us update team exec e-mail yet,
    although there's a fix e-mail API we could use if need be)
  */
  export function updateTeam(teamId: string, data: SelfTeamData) {
    var team = Stores.Teams.require(teamId);
    if (! team) return;

    // Clone team and set in store
    if (data.name) {
      team = _.cloneDeep(team);

      if (team.team_name !== data.name) {
        Analytics.track(Analytics.Trackable.UpdateGeneralPrefs, {
          teamName: data.name
        });
        team.team_name = data.name;
      }

      var p = Api.setTeamName(teamId, data.name)
      Stores.Teams.TeamStore.push(teamId, p, Option.wrap(team));
    };

    // Timezones => update preferences
    if (data.timezone) {
      Actions.TeamPreferences.setGeneral(teamId, {
        current_timezone: data.timezone
      });
    }
  }

  // Create a team for logged in user
  export function createSelfTeam(data: SelfTeamData) {
    return create({
      executive_name: data.name || Login.myEmail(),
      executive_email: Login.myEmail(),
      executive_timezone: data.timezone
    });
  }

  export function createExecTeam(data: ExecTeamData) {
    return create({
      executive_name: data.name || data.email,
      executive_email: data.email,
      executive_timezone: data.timezone
    });
  }

  // Used with Onboarding skip
  export function createDefaultTeam() {
    if (Stores.Teams.allIds().length > 0) {
      return $.Deferred<ApiT.Team>()
        .resolve(Stores.Teams.first())
        .promise();
    }
    return createSelfTeam({
      name: "",
      timezone: moment.tz.guess()
    });
  }

  // Remove a team
  export function removeTeam(teamId: string) {
    Api.deactivateTeam(teamId);
    Stores.Teams.remove(teamId);
    Analytics.track(Analytics.Trackable.DeactivateTeam, {
      teamId: teamId
    });
  }


  /* Team label management */

  // Add and remove exact, display versions of labels
  export function addLabel(_id: string, label: Types.LabelBase) {
    return applyLabels(_id, [], [label]);
  }

  export function rmLabel(_id: string, label: Types.LabelBase) {
    return applyLabels(_id, [label], []);
  }

  export function renameLabel(_id: string, oldLabel: Types.LabelBase, newLabel: Types.LabelBase)
  {
    return applyLabels(_id, [oldLabel], [newLabel]);
  }


  /////

  interface LabelUpdate {
    teamId: string;
    labels: ApiT.LabelInfo[];
  }

  export var LabelUpdateQueue = new Queue2.Processor(
    function(update: LabelUpdate) {
      Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
        numLabels: update.labels.length,
        _id: update.teamId,
        labels: _.map(update.labels, (l) => l.original)
      });

      // FIXME: Batching does not seem to work
      // return Api.batch(function() {
      var p = Api.putSyncedLabels(update.teamId, {
        labels: _.map(update.labels, (l) => l.original)
      });

      var promises = _.map(update.labels, (l) =>
        Api.setLabelColor(update.teamId, {
          label: l.original,
          color: l.color
        }));

      return p.then(() => Util.when(promises));
      // });
    },

    // Always use last update (put operation)
    function(updates) {
      return [updates[updates.length - 1]];
    });

  function applyLabels(_id: string, rmLabels: Types.LabelBase[], addLabels: Types.LabelBase[]) {
    var team = Stores.Teams.require(_id);
    if (! team) return;

    var newLabels = _.filter(team.team_api.team_labels, (l) =>
      !_.some(rmLabels, (label) => label.displayAs === l.original));
    newLabels = newLabels.concat(_.map(addLabels, (l) => ({
      original: cleanLabel(l.displayAs),
      normalized: l.id,
      color: l.color
    })));

    // Remove duplicates based on normalization
    newLabels = _.uniqBy(newLabels, (l) => l.normalized);

    return setTeamLabels(_id, team, newLabels);
  }

  export function putLabels(_id: string, labels: Types.LabelBase[]) {
    var team = Stores.Teams.require(_id);
    if (! team) return;

    var labelInfos = _.map(labels, (l) => ({
      original: l.displayAs,
      normalized: l.id,
      color: l.color
    }));

    return setTeamLabels(_id, team, labelInfos);
  }

  export function setLabelColor(_id: string,
                                labelInfo: ApiT.LabelInfo,
                                newColor: string) {
    var team = Stores.Teams.require(_id);
    if (! team) return;
    var oldLabelInfo = _.find(team.team_api.team_labels, labelInfo);
    if (!oldLabelInfo || oldLabelInfo.color == newColor) return;

    var teamCopy = _.cloneDeep(team);
    _.find(teamCopy.team_api.team_labels, labelInfo).color = newColor;

    var request = {
      label: labelInfo.original,
      color: newColor
    };

    var p = Api.setLabelColor(team.teamid, request);
    Stores.Teams.TeamStore.push(_id, p, Option.some(teamCopy));
  }

  // Cleans labels before submission to server
  export function cleanLabel(label: string) {
    return (label
      .replace(/##+/g, "#") // ## is reserved
      .trim());
  }

  function setTeamLabels(_id: string, team: ApiT.Team, labels: ApiT.LabelInfo[]) {
    // Store values immutable so clone
    var teamCopy = _.cloneDeep(team);

    /*
      Alphabetize when setting labels (better performance to sort now
      than in the gajillion places where we pull a list of team labels)
    */
    labels = _.sortBy(labels, (l) => l.normalized);

    // Don't do anything if no change
    if (_.isEqual(team.team_api.team_labels, labels)) {
      return $.Deferred<any>().resolve().promise();
    }

    teamCopy.team_api.team_labels = labels;

    var p = LabelUpdateQueue.enqueue(_id, {
      teamId: _id,
      labels: labels
    });
    Stores.Teams.TeamStore.push(_id, p, Option.some(teamCopy));
    return p;
  }
}
