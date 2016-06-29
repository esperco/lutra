/// <reference path="./Api.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Groups.ts" />

module Esper.Stores.GroupPreferences {

  // Key by groupId
  export var PrefsStore = new Model2.Store<string, ApiT.GroupPreferences>();

  export function get(groupId: string) {
    return PrefsStore.get(groupId).flatMap((p) => p.data);
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
    var apiP = Api.getAllGroupPrefs();
    PrefsStore.transactP(apiP,
      (apiP2) => apiP2.done(
        (response) => {
          _.each(response.prefs_list,
            (prefs) => PrefsStore.set(prefs.groupid, Option.some(prefs))
          );
          prefsLoadedDfd.resolve();
        }
      ).fail(() => prefsLoadedDfd.reject())
    );
  }


  ///////////

  export function makeNewPreferences(groupid: string): ApiT.GroupPreferences {
    var prefs = {
      groupid,
      uid: Login.me(),
      daily_breakdown: false,
      weekly_breakdown: false,
      bad_meeting_warning: false,
      bad_duration: 20,
      bad_attendees: 4
    };

    PrefsStore.set(groupid, Option.some(prefs));
    return prefs;
  }

  /*
    Populate certain null preferences with defaults so we don't have to deal
    with null/undefined values elsewhere
  */
  export function withDefaults(prefs: ApiT.GroupPreferences):
    ApiT.GroupPreferences
  {
    if (Object.isFrozen(prefs)) {
      prefs = _.cloneDeep(prefs);
    }
    prefs.daily_breakdown = false;
    prefs.weekly_breakdown = false;
    prefs.bad_duration = 20;
    prefs.bad_attendees = 4;

    return prefs;
  }
}
