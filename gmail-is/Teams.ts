/** This module keeps track of all of the teams associated with the
 *  active account.
 */
module Esper.Teams {
  var teams : ApiT.Team[] = [];
  var profiles = {};

  var alreadyInitialized = false;

  export function initialize() {
    if (!alreadyInitialized) {
      teams = Login.myTeams();
      Profile.getAllProfiles(teams).done(function (profileList) {
        List.concat(profileList).forEach(function (profile) {
          profiles[profile.profile_uid] = profile;
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
}