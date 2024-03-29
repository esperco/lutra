/// <reference path="./Api.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Teams.ts" />

module Esper.Stores.TeamPreferences {

  // Key by teamId
  export var PrefsStore = new Model2.Store<string, ApiT.Preferences>();

  export function get(teamId: string) {
    return PrefsStore.get(teamId).flatMap((p) => p.data);
  }

  var prefsLoadedDfd: JQueryDeferred<void>;
  export function getInitPromise() {
    if (! prefsLoadedDfd) {
      init();
    }
    return prefsLoadedDfd.promise();
  }

  // Alias for init -- but separate name in case we want to make init
  // smarter in the future
  export function reload() {
    init();
  }

  export function init() {
    prefsLoadedDfd = $.Deferred<void>();
    var apiP = Api.getAllPreferences();
    PrefsStore.transactP(apiP,
      (apiP2) => apiP2.done(
        (response) => {
          _.each(response.preferences_list,
            (prefs) => PrefsStore.set(prefs.teamid, Option.some(prefs))
          );
          prefsLoadedDfd.resolve();
        }
      ).fail(() => prefsLoadedDfd.reject())
    );
  }


  ///////////

  export interface PrefsWithDefaults extends ApiT.Preferences {
    label_reminder: {
      recipients_: string[]
    };
    email_types: {
      daily_agenda: ApiT.EmailPref;
      tasks_update: ApiT.EmailPref;
      feedback_summary: ApiT.EmailPref;
    };
  }

  /*
    Populate certain null preferences with defaults so we don't have to deal
    with null/undefined values elsewhere
  */
  export function withDefaults(prefs: ApiT.Preferences): PrefsWithDefaults {
    if (Object.isFrozen(prefs)) {
      prefs = _.cloneDeep(prefs);
    }
    prefs.label_reminder = prefs.label_reminder || {recipients_: []};
    prefs.label_reminder.recipients_ = prefs.label_reminder.recipients_ || [];

    if (! prefs.email_types.feedback_summary) {
      prefs.email_types.feedback_summary = _.cloneDeep(
        prefs.email_types.daily_agenda
      );
      prefs.email_types.feedback_summary.recipients = [];
    }

    return (<PrefsWithDefaults> prefs);
  }
}
