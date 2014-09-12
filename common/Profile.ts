/*
  Cached profiles
*/
module Esper.Profile {
  /*
    We're assuming that a profile returned by the API is the same regardless of
    the team it was requested from.
  */
  var profiles: { [uid: string]: JQueryPromise<ApiT.Profile> } = {};

  export function get(uid, teamid): JQueryPromise<ApiT.Profile> {
    if (profiles[uid] === undefined) {
      profiles[uid] = Api.getProfile(uid, teamid);
    }
    return profiles[uid];
  }

  export function getTeamProfiles(team: ApiT.Team):
  JQueryPromise<ApiT.Profile[]> {
    var teamMembers = List.copy(team.team_assistants);
    teamMembers.push(team.team_executive);
    var l =
      List.map(teamMembers, function(uid) {
        return get(uid, team.teamid);
      });
    return Promise.join(l);
  }

  export function getAllProfiles(teams : ApiT.Team[]):
  JQueryPromise<ApiT.Profile[][]> {
    var profileLists =
      List.map(teams, function(team) {
        return getTeamProfiles(team);
      });
    return Promise.join(profileLists);
  }
}
