/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.Login {

  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  var loginDeferred: JQueryDeferred<ApiT.LoginResponse> = $.Deferred();
  export var loginPromise = loginDeferred.promise();

  export function init() {
    if (! Login.loggedIn()) {
      InfoStore.set(null, { dataStatus: Model.DataStatus.FETCHING });

      var onFail = function(err: Error) {
        InfoStore.set(null, { dataStatus: Model.DataStatus.READY });
        loginDeferred.reject(err);
      };

      Login.loginViaIframe()
        .then(function() {
          return Api.getLoginInfo();
        }, onFail)
        .then(function(loginInfo) {
          InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
          loginDeferred.resolve(loginInfo);
        }, onFail);
    }
  }

  /*
    Return a login URL that redirects back to the curent page
  */
  export function loginURL() {
    // Double encode URI because of pageJs issue (see Otter's Route.ts)
    var here = encodeURIComponent(encodeURIComponent(location.href));
    return Api.prefix + "/#!/login-redirect/" + here;
  }
}