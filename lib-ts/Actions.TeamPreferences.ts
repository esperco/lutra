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
    var hasChanges = Stores.TeamPreferences.get(teamId).match({
      none: () => true,
      some: (p) => !_.isEqual(p.general, _.extend({}, p.general, general))
    });

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

  // Enable or disable feedback summary eail
  export function toggleFeedbackSummary(prefs: ApiT.Preferences) {
    var emailTypes = _.cloneDeep(prefs.email_types);
    if (! emailTypes.feedback_summary) {
      emailTypes.feedback_summary = _.cloneDeep(emailTypes.daily_agenda);
      emailTypes.feedback_summary.recipients = [];
    }

    var active = toggleEmail(emailTypes.feedback_summary.recipients);
    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      feedbackSummary: active
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

  /*
    Toggles post-meeting feedback e-mails
  */
  export function toggleEmailFeedback(prefs: ApiT.Preferences) {
    prefs.timestats_notify.email_for_meeting_feedback =
      !prefs.timestats_notify.email_for_meeting_feedback;

    var promise = Api.setTimestatsNotifyPrefs(
      prefs.teamid,
      prefs.timestats_notify
    );
    update(prefs.teamid, promise, (newPrefs) => {
      newPrefs.timestats_notify = prefs.timestats_notify;
      return newPrefs;
    });

    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      feedbackEmail: prefs.timestats_notify.email_for_meeting_feedback
    });
  }

  /*
    Toggles Slack setting -- also checks if Slack authorization is required
    and redirects as appropriate
  */
  export function toggleSlackFeedback(prefs: ApiT.Preferences) {
    prefs.timestats_notify.slack_for_meeting_feedback =
      !prefs.timestats_notify.slack_for_meeting_feedback;

    var promise = Api.setTimestatsNotifyPrefs(
      prefs.teamid, prefs.timestats_notify);

    // Check if we need Slack authorization
    if (prefs.timestats_notify.slack_for_meeting_feedback) {
      promise = promise.then(function() {
        return Api.getSlackAuthInfo(prefs.teamid)
      }).then(function(x: ApiT.SlackAuthInfo) {
        if (! x.slack_authorized) {
          location.href = x.slack_auth_url;
        }
      });
    }

    update(prefs.teamid, promise, (newPrefs) => {
      newPrefs.timestats_notify = prefs.timestats_notify;
      return newPrefs;
    });

    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      feedbackSlack: prefs.timestats_notify.slack_for_meeting_feedback
    });
  }

  /*
    Toggles post-meeting feedback e-mails
  */
  export function updateNotifTiming(prefs: ApiT.Preferences, val: number) {
    prefs.timestats_notify.time_to_notify_since_meeting_start = val;

    var promise = Api.setTimestatsNotifyPrefs(
      prefs.teamid,
      prefs.timestats_notify
    );
    update(prefs.teamid, promise, (newPrefs) => {
      newPrefs.timestats_notify = prefs.timestats_notify;
      return newPrefs;
    });

    Analytics.track(Analytics.Trackable.UpdateNotifications, {
      timeToNotify: val
    });
  }
}
