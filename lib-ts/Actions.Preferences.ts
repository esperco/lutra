/*
  Preferences-related actions
*/

/// <reference path="./Stores.Preferences.ts" />

module Esper.Actions.Preferences {
  function update(
    teamId: string,
    promise: JQueryPromise<any>,
    fn: (prefs: ApiT.Preferences) => ApiT.Preferences
  ) {
    // Update prefs in store if data present
    Stores.Preferences.getInitPromise().done(function() {
      Stores.Preferences.PrefsStore.get(teamId).match({
        none: () => Log.e("Updating prefs for team not stored yet"),
        some: (storeData) => {
          storeData.data.match({
            none: () => Log.e("No prefs found for team - " + teamId),
            some: (prefs) => {
              prefs = fn(_.cloneDeep(prefs))
              Stores.Preferences.PrefsStore.push(teamId,
                promise, Option.some(prefs));
            }
          })
        }
      });
    });
  }

  export function setGeneral(teamId: string, general: ApiT.GeneralPrefsOpts) {
    var promise = Api.setGeneralPreferences(teamId, general);
    update(teamId, promise, (prefs) => {
      return <ApiT.Preferences> _.extend(prefs, { general: general })
    });
  }

  export function setLabelReminders(teamId: string,
                                    labelReminder: ApiT.SimpleEmailPref) {
    var promise = Api.setLabelReminderPrefs(teamId, labelReminder);
    update(teamId, promise, (prefs) => {
      prefs.label_reminder = labelReminder;
      return prefs;
    });
  }

  export function setEmailTypes(teamId: string,
                                emailTypes: ApiT.EmailTypes) {
    var promise = Api.setEmailTypes(teamId, emailTypes);
    update(teamId, promise, (prefs) => {
      prefs.email_types = emailTypes;
      return prefs;
    });
  }
}
