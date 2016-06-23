/*
  Preferences-related actions
*/

/// <reference path="./Stores.GroupPreferences.ts" />

module Esper.Actions.GroupPreferences {
  function update(
    groupId: string,
    promise: JQueryPromise<any>,
    fn: (prefs: ApiT.GroupPreferences) => ApiT.GroupPreferences
  ) {
    // Update prefs in store if data present
    Stores.GroupPreferences.getInitPromise().done(function() {
      Stores.GroupPreferences.PrefsStore.get(groupId).match({
        none: () => Log.e("Updating prefs for group not stored yet"),
        some: (storeData) => {
          storeData.data.match({
            none: () => Log.e("No prefs found for group - " + groupId),
            some: (prefs) => {
              prefs = fn(_.cloneDeep(prefs))
              Stores.GroupPreferences.PrefsStore.push(groupId,
                promise, Option.some(prefs));
            }
          })
        }
      });
    });
  }

  // Enable or disable label reminder email
  export function toggleLabelReminders(oldPrefs: ApiT.GroupPreferences) {
    var groupId = oldPrefs.groupid;
    var newPrefs = _.cloneDeep(oldPrefs);
    newPrefs.label_reminder = !oldPrefs.label_reminder;
    var promise = Api.putGroupPreferences(groupId, newPrefs);
    update(groupId, promise, (prefs) => {
      prefs.label_reminder = newPrefs.label_reminder;
      return prefs;
    });
  }
}
