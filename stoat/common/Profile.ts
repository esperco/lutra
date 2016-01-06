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
    var teamMembers = Team.members(team);
    var l =
      List.map(teamMembers, function(uid) {
        return get(uid, team.teamid);
      });
    return Promise.join(l);
  }

  export function fetchAllProfiles():
  JQueryPromise<ApiT.Profile[]> {
    return Api.getAllTeamProfiles().then(function(response) {
      var profiles = response.profile_list;
      List.iter(profiles, function(prof) {
        profiles[prof.profile_uid] = Promise.defer(prof);
      });
      return profiles;
    });
  }
}
