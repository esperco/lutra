/*
  Preferences-related actions
*/

/// <reference path="./Actions.Calendars.ts" />
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

  // Alters general preferences and saves in store
  export function setGeneral(teamId: string, general: ApiT.GeneralPrefsOpts) {
    var promise = Api.setGeneralPreferences(teamId, general);
    update(teamId, promise, (prefs) => {
      return <ApiT.Preferences> _.extend(prefs, { general: general })
    });
  }

  // Enable or disable label reminder email
  export function toggleLabelReminders(prefs: ApiT.Preferences) {
    var labelReminder  = _.cloneDeep(prefs.label_reminder) || {};
    labelReminder.recipients_ = toggleEmail(labelReminder.recipients_);
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
    emailTypes.daily_agenda.recipients = toggleEmail(
      emailTypes.daily_agenda.recipients);

    // Reactivating daily agenda => update calendar prefs
    if (_.includes(emailTypes.daily_agenda.recipients, Login.myEmail())) {
      Actions.Calendars.reactivateDailyAgenda(prefs.teamid);
    }
    setEmailTypes(prefs.teamid, emailTypes);
  }

  // Enable or disable feedback summary eail
  export function toggleFeedbackSummary(prefs: ApiT.Preferences) {
    var emailTypes = _.cloneDeep(prefs.email_types);
    if (! emailTypes.feedback_summary) {
      emailTypes.feedback_summary = _.cloneDeep(emailTypes.daily_agenda);
      emailTypes.feedback_summary.recipients = [];
    }

    emailTypes.feedback_summary.recipients = toggleEmail(
      emailTypes.feedback_summary.recipients);
    setEmailTypes(prefs.teamid, emailTypes);
  }

  // Set eail type prefs
  export function setEmailTypes(teamId: string,
                                emailTypes: ApiT.EmailTypes) {
    var promise = Api.setEmailTypes(teamId, emailTypes);
    update(teamId, promise, (prefs) => {
      prefs.email_types = emailTypes;
      return prefs;
    });
    return promise;
  }

  // Adds or removes current user from a recipipent list
  function toggleEmail(recipients?: string[]) {
    recipients = recipients || [];
    if (_.includes(recipients, Login.myEmail())) {
      return _.without(recipients, Login.myEmail());
    } else {
      return recipients.concat([Login.myEmail()]);
    }
  }
}
