/*
  Module for managing feature flags for a logged in user
*/

/// <reference path="./Api.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Login.Web.ts" />

module Esper.Actions.FeatureFlags {
  export function set(flags: ApiT.FeatureFlagsPatch) {
    var info = Login.getLoginInfo().unwrapOr(null);
    if (info) {
      let newFlags = _.extend(
        {}, info.feature_flags, flags
      ) as ApiT.FeatureFlags;
      if (! _.isEqual(newFlags, info.feature_flags)) {
        info = _.clone(info);
        info.feature_flags = newFlags;
        Api.patchFeatureFlags(flags);
        Login.setLoginInfoData(info);
      }
    }
  }
}
