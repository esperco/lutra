/*
  Cached executive preferences
*/
module Esper.Preferences {
  var preferences: { [teamid: string]: JQueryPromise<ApiT.Preferences> } = {};

  export function get(teamid: string): JQueryPromise<ApiT.Preferences> {
    if (preferences[teamid] === undefined) {
      preferences[teamid] = Api.getPreferences(teamid);
    }
    return preferences[teamid];
  }

  export function getAllPreferences(teams: ApiT.Team[]):
  JQueryPromise<ApiT.Preferences[]> {
    var l = List.map(teams, function(team: ApiT.Team) {
      return get(team.teamid);
    });
    return Promise.join(l);
  }
}
