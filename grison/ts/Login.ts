/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.Oauth.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.Login {
  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  var initialized = false;

  // Set callback for when loginInfo is set
  export function init() {

    // Set up callbacks if not already set up
    if (! initialized) {
      onSuccess(function(loginInfo) {
        InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
        Analytics.identify(loginInfo, true);
        if (loginInfo) {
          Raven.setUserContext({
            email: loginInfo.email,
            id: loginInfo.uid,
            platform: loginInfo.platform
          });
        }
      });
      initialized = true;
    }

    // This starts OAuth storage check and getLoginInfo sequence
    initLogin();
  }

  export function logout() {
    clear();
    InfoStore.set(null, { dataStatus: Model.DataStatus.READY });
    Analytics.identify(null); // Resets identity
    window.location.reload();
  }
}