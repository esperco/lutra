/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.Login {

  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  export function init() {
    if (! Login.loggedIn()) {
      InfoStore.set(null, { dataStatus: Model.DataStatus.FETCHING });

      var onFail = function() {
        InfoStore.set(null, { dataStatus: Model.DataStatus.READY });
      };

      Login.loginViaIframe()
        .then(function() {
          return Api.getLoginInfo();
        }, onFail)
        .then(function(loginInfo) {
          InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
        }, onFail);
    }
  }
}