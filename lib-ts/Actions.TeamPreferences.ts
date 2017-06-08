/*
  Preferences-related actions
*/

/// <reference path="./Actions.Calendars.ts" />
/// <reference path="./Stores.TeamPreferences.ts" />

module Esper.Actions.TeamPreferences {
  function update(
    teamId: string,
    promise: JQueryPromise<any>,
    fn: (prefs: ApiT.Preferences) => ApiT.Preferences
  ) {
    // Update prefs in store if data present
    Stores.TeamPreferences.getInitPromise().done(function() {
      Stores.TeamPreferences.PrefsStore.get(teamId).match({
        none: () => Log.e("Updating prefs for team not stored yet"),
        some: (storeData) => {
          storeData.data.match({
            none: () => Log.e("No prefs found for team - " + teamId),
            some: (prefs) => {
              prefs = fn(_.cloneDeep(prefs))
              Stores.TeamPreferences.PrefsStore.push(teamId,
                promise, Option.some(prefs));
            }
          })
        }
      });
    });
  }

  // Alters general preferences and saves in store
  export function setGeneral(teamId: string, general: ApiT.GeneralPrefsOpts) {
    var hasChanges = Stores.TeamPreferences.get(teamId).mapOr(
      true,
      (p) => !_.isEqual(p.general, _.extend({}, p.general, general))
    );

    if (hasChanges) {
      var promise = Api.setGeneralPreferences(teamId, general);
      Analytics.track(Analytics.Trackable.UpdateGeneralPrefs, general);
      update(teamId, promise, (prefs) => {
        prefs.general =
          <ApiT.GeneralPrefs> _.extend({}, prefs.general, general);
        return prefs;
      });
    }
  }

  /*
    Toggles hyperlinks in calendar event descriptions
  */
  export function toggleEsperEventLink(prefs: ApiT.Preferences) {
    prefs = _.cloneDeep(prefs);
    prefs.event_link = !prefs.event_link;

    var promise = Api.setPreferences(prefs.teamid, prefs);

    update(prefs.teamid, promise, (newPrefs) => {
      newPrefs.event_link = prefs.event_link;
      return newPrefs;
    });
  }

  // Enable or disable label reminder email
  export function toggleLabelReminders(prefs: ApiT.Preferences) {
    var labelReminder  = _.cloneDeep(prefs.label_reminder) || {};
    var active = toggleEmail(labelReminder.recipients_);
    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      labelReminders: active
    });
    setLabelReminders(prefs.teamid, labelReminder);
  }

  // Makes actual API call for setting label remainders
  export function setLabelReminders(teamId: string,
                                    labelReminder: ApiT.SimpleEmailPref) {
    var promise = Api.setLabelReminderPrefs(teamId, labelReminder);
    update(teamId, promise, (prefs) => {
      prefs.label_reminder = labelReminder;
      return prefs;
    });
  }

  // Enable or disable daily agenda
  export function toggleDailyAgenda(prefs: ApiT.Preferences) {
    var emailTypes = _.cloneDeep(prefs.email_types);
    var active = toggleEmail(emailTypes.daily_agenda.recipients);

    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      dailyAgenda: active
    });
    setEmailTypes(prefs.teamid, emailTypes);
  }

  // Set email type prefs
  export function setEmailTypes(teamId: string,
                                emailTypes: ApiT.EmailTypes) {
    var promise = Api.setEmailTypes(teamId, emailTypes);
    update(teamId, promise, (prefs) => {
      prefs.email_types = emailTypes;
      return prefs;
    });
  }

  /*
    Adds or removes current user from a recipipent list -- mutates structure.
    Returns true if adding, false if removing.
  */
  function toggleEmail(recipients: string[]) {
    if (_.includes(recipients, Login.myEmail())) {
      _.pull(recipients, Login.myEmail());
      return false;
    } else {
      recipients.push(Login.myEmail());
      return true;
    }
  }
}
