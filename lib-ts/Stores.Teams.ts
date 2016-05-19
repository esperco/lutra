/*
  Refactored module for storing team data, along with helpers.
  Helpers for getting and setting current team info
*/

/// <reference path="./Model2.Batch.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Login.Web.ts" />

module Esper.Stores.Teams {

  /* Stores */

  export var TeamStore = new Model2.Store<string, ApiT.Team>({
    idForData: (team) => team.teamid
  });

  // Only store key for current user (which must be empty string)
  type BatchKeyType = "";
  var batchKey: BatchKeyType = "";
  export var TeamListStore = new Model2.BatchStore
    <BatchKeyType, string, ApiT.Team>(TeamStore);


  /* Helper Functions */

  export function get(teamId: string): Option.T<ApiT.Team> {
    return TeamStore.get(teamId).flatMap((t) => t.data);
  }

  // Like get, but logs error if team doe not exist
  export function require(teamId: string): ApiT.Team {
    return get(teamId).match({
      none: (): ApiT.Team => {
        Log.e("Teams.require called with non-existent team - " + teamId);
        TeamStore.setSafe(teamId, Option.none<ApiT.Team>(), {
          dataStatus: Model2.DataStatus.PUSH_ERROR
        });
        return null;
      },
      some: (t) => t
    })
  }

  export function status(teamId: string): Option.T<Model2.DataStatus> {
    return TeamStore.get(teamId).flatMap((t) => Option.wrap(t.dataStatus));
  }

  export function all(): ApiT.Team[] {
    return TeamListStore.batchGet(batchKey).match({
      none: (): ApiT.Team[] => [],
      some: (d) => d.data.match({

        none: (): ApiT.Team[] => [],
        some: (items) => Option.flatten(_.map(items, (i) => i.data))
      })
    });
  }

  export function allIds(): string[] {
    return TeamListStore.get(batchKey).match({
      none: () => [],
      some: (d) => d.data.match({
        none: () => [],
        some: (ids) => ids
      })
    });
  }

  export function first(): ApiT.Team {
    return all()[0];
  }

  export function firstId(): string {
    return allIds()[0];
  }


  //////////

  export function set(team: ApiT.Team): string {
    TeamStore.setSafe(team.teamid, Option.wrap(team));

    var currentTeamIds = _.clone(allIds());
    currentTeamIds.push(team.teamid);
    currentTeamIds = _.uniq(currentTeamIds);
    TeamListStore.setSafe(batchKey, Option.some(currentTeamIds));

    return team.teamid;
  }

  export function remove(teamId: string) {
    TeamStore.remove(teamId);

    var currentTeamIds = _.clone(allIds());
    _.pull(currentTeamIds, teamId);
    TeamListStore.setSafe(batchKey, Option.some(currentTeamIds));
  }


  //////////

  // Find the normalized form of a team label
  export function getNormLabel(label: string) {
    var teams = all();
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


  /* Init helpers */

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    var teams = _.filter(loginResponse.teams,
      (t) => t.team_timestats_calendars &&
             t.team_timestats_calendars.length > 0
    );
    var data = _.map(teams, (t) => ({
      itemKey: t.teamid,
      data: Option.wrap(t)
    }));
    TeamListStore.batchSet(batchKey, Option.some(data))
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
