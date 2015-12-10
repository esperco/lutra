/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Store.ts" />

module Esper.Login {

  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  var loginDeferred: JQueryDeferred<ApiT.LoginResponse> = $.Deferred();
  export var loginPromise = loginDeferred.promise();

  var profileDeferred: JQueryDeferred<ApiT.DirProfile> = $.Deferred();
  export var profilePromise = profileDeferred.promise();

  export function init() {
    if (! Login.loggedIn()) {
      InfoStore.set(null, { dataStatus: Model.DataStatus.FETCHING });

      var onFail = function(err: Error) {
        InfoStore.set(null, { dataStatus: Model.DataStatus.READY });
        Analytics.identify(null); // Resets identity
        loginDeferred.reject(err);
      };

      if (Store.get("uid") === undefined) {
        Login.loginViaIframe()
          .then(function() {
            return Api.getLoginInfo();
          }, onFail)
          .then(function(loginInfo) {
            InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
            Analytics.identify(loginInfo, false, function() {
              loginDeferred.resolve(loginInfo);
            });
          }, onFail);
      } else {
        Login.setCredentials(Store.get("uid"), Store.get("api_secret"));
        Api.getLoginInfo().then(function(loginInfo) {
          InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
          Analytics.identify(loginInfo, false, function() {
            loginDeferred.resolve(loginInfo);
          });
        }, onFail);
      }
    }
  }

  /*
    Return a login URL that redirects back to the curent page
  */
  export function loginURL() {
    return Api.prefix + "/#!/login-redirect/" + here();
  }

  // Ditto, but logs out user
  export function logoutURL() {
    return Api.prefix + "/#!/logout-redirect/" + home();
  }

  // Returns current href, but double encodes because of pageJs issue (see
  // Otter's Route.ts)
  function here() {
    return encodeURIComponent(encodeURIComponent(location.href));
  }

  // Returns current domain only, also double-encodes
  function home() {
    return encodeURIComponent(encodeURIComponent(
      location.protocol + "//" + location.host
    ));
  }
}