/*
  Refactored module for actions that create or alter teams
*/

/// <reference path="./Labels.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.Teams.ts" />

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
      }
      return t;
    });
    Save.monitor(Stores.Teams.TeamStore, "new-team", p);
    return p;
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

  var LabelUpdateQueue = new Queue2.Processor(
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

    console.info(labels);
    var p = LabelUpdateQueue.enqueue(_id, {
      teamId: _id,
      labels: labels
    });
    Stores.Teams.TeamStore.push(_id, p, Option.some(teamCopy));
    return p;
  }
}
