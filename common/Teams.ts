/** This module keeps track of all of the teams associated with the
 *  active account.
 */

/// <reference path="./Profile.ts" />
/// <reference path="./Promise.ts" />
/// <reference path="./Preferences.ts" />

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
  export function initialize(force=false): JQueryPromise<void> {
    if (!initJob || force) {
      // Ensures that Teams.initialize waits until *after* Login complets
      initJob = Login.nextLogin().done(function() {
        Log.d("Initializing Teams");
        teams = Login.myTeams();
        var profilesJob =
          Profile.fetchAllProfiles().done(function(profileList) {
            profileList.forEach(function(profile) {
              profiles[profile.profile_uid] = profile;
            });
          });
        var prefsJob =
          Preferences.fetchAllPreferences().done(function(prefList) {
            prefList.forEach(function(prefs) {
              preferences[prefs.teamid] = prefs;
            });
          });
        return Promise.join([
          Promise.ignore(profilesJob),
          Promise.ignore(prefsJob)
        ]);
      }).then(function() {
        Log.d("Finished initializing teams.");
        alreadyInitialized = true;
      });
    }
    return initJob;
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
