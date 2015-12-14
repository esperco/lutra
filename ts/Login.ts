/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />

module Esper.Login {

  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  var loginDeferred: JQueryDeferred<ApiT.LoginResponse> = $.Deferred();
  export var loginPromise = loginDeferred.promise();

  export function init() {
    if (!Login.loggedIn() && !TESTING) {
      InfoStore.set(null, { dataStatus: Model.DataStatus.FETCHING });

      var onFail = function(err: Error) {
        InfoStore.set(null, { dataStatus: Model.DataStatus.READY });
        Analytics.identify(null); // Resets identity
        loginDeferred.reject(err);
      };

      Login.loginViaIframe()
        .then(function() {
          return Api.getLoginInfo();
        }, onFail)
        .then(function(loginInfo) {
          InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
          Analytics.identify(loginInfo, false, function() {
            loginDeferred.resolve(loginInfo);
          });

          if (loginInfo) {
            Raven.setUserContext({
              email: loginInfo.email,
              id: loginInfo.uid,
              platform: loginInfo.platform
            });
          }
        }, onFail);
    }
  }

  /*
    Return a login URL that redirects back to the curent page
  */
  export function loginURL() {
    if (window.btoa) {
      return Api.prefix + "/#!/login-redirect-b64/" + here64();
    }
    return Api.prefix + "/#!/login-redirect/" + here();
  }

  // Ditto, but logs out user
  export function logoutURL() {
    if (window.btoa) {
      return Api.prefix + "/#!/logout-redirect-b64/" + home64();
    }
    return Api.prefix + "/#!/logout-redirect/" + home();
  }

  // Returns current href, but double encodes because of pageJs issue (see
  // Otter's Route.ts)
  function here() {
    return encodeURIComponent(encodeURIComponent(location.href));
  }

  function here64() {
    return encodeURIComponent(btoa(location.href));
  }

  // Returns current domain only, also double-encodes
  function home() {
    return encodeURIComponent(encodeURIComponent(
      location.protocol + "//" + location.host
    ));
  }

  function home64() {
    return encodeURIComponent(btoa(location.protocol + "//" + location.host));
  }
}