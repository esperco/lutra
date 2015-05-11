/** This module keeps track of all of the teams associated with the
 *  active account.
 */
module Esper.Teams {
  var teams : ApiT.Team[] = [];
  var profiles = {};
  var preferences = {};

  var initJob: JQueryPromise<void>;
  var alreadyInitialized = false;

  /** Prefetch user profiles and executive preferences for all the teams
      of the current user.
      The resulting promise is cached, and returned unless the `force=true`
      parameter is passed.
  */
  export function initialize(force = false): JQueryPromise<void> {
    if (initJob && !force) {
      return initJob;
    } else {
      teams = Login.myTeams();
      var profilesJob =
        Profile.getAllProfiles(teams).done(function (profileList) {
          List.concat(profileList).forEach(function (profile) {
            profiles[profile.profile_uid] = profile;
          });
        });
      var prefsJob =
        Preferences.getAllPreferences(teams).done(function (prefList) {
          prefList.forEach(function (prefs) {
            preferences[prefs.teamid] = prefs;
          });
        });
      // I don't understand the type error that the <any> fixes...
      initJob = Promise.join([profilesJob, <any> prefsJob])
        .then(function(l) {});
      initJob.done(function() { alreadyInitialized = true; });
      return initJob;
    }
  }

  /** Returns the profile for the given user if the user is in one of
   *  the current teams. If the user can't be found, returns null.
   */
  export function getProfile(uid: string): ApiT.Profile {
    if (!alreadyInitialized) {
      Log.e("Profiles were not prefetched.");
      return null;
    } else if (uid in profiles) {
      return profiles[uid];
    } else {
      Log.e("No profile found for user " + uid);
      return null;
    }
  }

  export function getPreferences(teamid: string): ApiT.Preferences {
    if (!alreadyInitialized) {
      Log.e("Preferences were not prefetched.");
      return null;
    } else if (teamid in preferences) {
      return preferences[teamid];
    } else {
      Log.e("No preferences found for team " + teamid);
      return null;
    }
  }

  export function getTeamPreferences(team: ApiT.Team): ApiT.Preferences {
    if (team && team.teamid) {
      return getPreferences(team.teamid);
    } else {
      Log.e("getTeamPreferences: Not a valid team");
      return null;
    }
  }
}
