/*
  Refactored module for actions that create or alter teams
*/

/// <reference path="./Labels.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./Actions.Preferences.ts" />

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
    var p = Api.createTeam(req).then((t) => {
      if (t && t.teamid) {
        Stores.Teams.set(t);

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
      team.team_name = data.name;

      var p = Api.setTeamName(teamId, data.name)
      Stores.Teams.TeamStore.push(teamId, p, Option.wrap(team));
    };

    // Timezones => update preferences
    if (data.timezone) {
      Actions.Preferences.setGeneral(teamId, {
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


  /* Team label management */

  // Add and remove exact, display versions of labels
  export function addLabel(_id: string, label: string) {
    return applyLabels(_id, [], [label]);
  }

  export function rmLabel(_id: string, label: string) {
    return applyLabels(_id, [label], []);
  }

  export function renameLabel(_id: string, oldLabel: string, newLabel: string)
  {
    return applyLabels(_id, [oldLabel], [newLabel]);
  }


  /////

  interface LabelUpdate {
    teamId: string;
    labels: string[];
  }

  export var LabelUpdateQueue = new Queue2.Processor(
    function(update: LabelUpdate) {
      Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
        numLabels: update.labels.length,
        _id: update.teamId,
        labels: update.labels
      });

      return Api.putSyncedLabels(update.teamId, { labels: update.labels });
    },

    // Always use last update (put operation)
    function(updates) {
      return [updates[updates.length - 1]];
    });

  function applyLabels(_id: string, rmLabels: string[], addLabels: string[]) {
    var team = Stores.Teams.require(_id);
    if (! team) return;

    var newLabels = _.filter(team.team_labels,
      (l) => !_.includes(rmLabels, l)
    );
    newLabels = newLabels.concat(addLabels);

    // Remove duplicates based on normalization
    newLabels = _.uniqBy(newLabels, Stores.Teams.getNormLabel);

    return setTeamLabels(_id, team, newLabels);
  }

  export function putLabels(_id: string, labels: string[]) {
    var team = Stores.Teams.require(_id);
    if (! team) return;

    if (_.isEqual(team.team_labels, labels)) {
      return $.Deferred<void>().resolve().promise();
    }

    return setTeamLabels(_id, team, labels);
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
    teamCopy.team_labels_norm = _.map(labels, Stores.Teams.getNormLabel);

    var p = LabelUpdateQueue.enqueue(_id, {
      teamId: _id,
      labels: labels
    });
    Stores.Teams.TeamStore.push(_id, p, Option.some(teamCopy));
    return p;
  }
}
