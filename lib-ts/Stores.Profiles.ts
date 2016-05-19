/*
  Store profile info for team members
*/

/// <reference path="./Model2.Batch.ts" />
/// <reference path="./Api.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Login.Web.ts" />

module Esper.Stores.Profiles {

  // Index by user UID
  export var ProfileStore = new Model2.Store<string, ApiT.Profile>({
    idForData: (profile) => profile.profile_uid,
    cap: 100
  });

  export function get(uid: string) {
    return ProfileStore.get(uid).flatMap((p) => p.data);
  }

  var profilesLoadedDfd: JQueryDeferred<void>;
  export function getInitPromise() {
    if (! profilesLoadedDfd) {
      init();
    }
    return profilesLoadedDfd.promise();
  }

  // Alias for init -- but separate name in case we want to make init
  // smarter in the future
  export function reload() {
    init();
  }

  export function init() {
    profilesLoadedDfd = $.Deferred<void>();
    var apiP = Api.getAllProfiles();
    ProfileStore.transactP(apiP,
      (apiP2) => apiP2.done(
        (response) => {
          _.each(response.profile_list,
            (p) => ProfileStore.set(p.profile_uid, Option.some(p))
          );
          profilesLoadedDfd.resolve();
        }
      ).fail(() => profilesLoadedDfd.reject())
    );
  }
}
