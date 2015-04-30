/** This module keeps track of all of the teams associated with the
 *  active account.
 */
module Esper.Teams {
  var teams : ApiT.Team[] = [];
  var profiles = {};
  var preferences = {};

  var alreadyInitialized = false;

  export function initialize() {
    if (!alreadyInitialized) {
      teams = Login.myTeams();
      alreadyInitialized = true;
      Profile.getAllProfiles(teams).done(function (profileList) {
        List.concat(profileList).forEach(function (profile) {
          profiles[profile.profile_uid] = profile;
        });
      });
      Preferences.getAllPreferences(teams).done(function (prefList) {
        prefList.forEach(function (prefs) {
          preferences[prefs.teamid] = prefs;
        });
      });
    }
  }

  /** Returns the profile for the given user if the user is in one of
   *  the current teams. If the user can't be found, returns null.
   */
  export function getProfile(uid) {
    if (uid in profiles) {
      return profiles[uid];
    } else {
      return null;
    }
  }

  export function getPreferences(uid) {
    if (uid in preferences) {
      return preferences[uid];
    } else {
      return null;
    }
  }
}
