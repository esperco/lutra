/*
  Preferences-related actions
*/

/// <reference path="./Stores.Preferences.ts" />

module Esper.Actions.Preferences {
  export function setGeneral(teamId: string, general: ApiT.GeneralPrefsOpts) {
    var promise = Api.setGeneralPreferences(teamId, general);

    // Update prefs in store if data present
    Stores.Preferences.getInitPromise().done(function() {
      Stores.Preferences.PrefsStore.get(teamId).match({
        none: () => Log.e("Updating prefs for team not stored yet"),
        some: (storeData) => {
          storeData.data.match({
            none: () => Log.e("No prefs found for team - " + teamId),
            some: (prefs) => {
              prefs.general =
                <ApiT.GeneralPrefs> _.extend({}, prefs.general, general);
              Stores.Preferences.PrefsStore.push(teamId,
                promise, Option.some(prefs));
            }
          })
        }
      });
    });
  }
}
