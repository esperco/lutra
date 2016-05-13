/// <reference path="./Api.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Teams.ts" />

module Esper.Stores.Preferences {

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
}
