/*
  Refactored login code for OAuth clients (Zorilla, Grison, Otter)
*/

/// <reference path="../typings/ravenjs/ravenjs.d.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/LocalStore.ts" />
/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Login {
  var nonceKey = "login_nonce";

  function setLoginNonce() {
    /*
      We use Esper as our random number generator because it's
      a single implementation and it's under our control, as opposed
      to whatever broken browser the user might use.

      TODO: Consider switching to client-side secure RNG if available
      (window.crypto) or use a third-party library for this.
    */
    return Api.random()
      .then(function(x) {
        var loginNonce = x.random;
        if (loginNonce.length >= 64) {
          LocalStore.set(nonceKey, loginNonce);
          return loginNonce;
        }
      });
  }

  function getLoginNonce() {
    return LocalStore.get(nonceKey);
  }

  function clearLoginNonce() {
    LocalStore.remove(nonceKey);
  }

  interface LoginOpts {
    landingUrl?: string;
    inviteCode?: string;
    email?: string;
  }

  // Redirect to Google OAuth
  export function loginWithGoogle(opts?: LoginOpts)
  {
    opts = opts || {};
    var landingUrl = opts.landingUrl || getPath();

    return setLoginNonce()
      .then(function(loginNonce) {
        return Api.getGoogleAuthUrl(landingUrl,
          loginNonce, opts.inviteCode, opts.email);
      })
      .then(function(x) {
        Log.d("Going off to " + x.url);
        location.href = x.url;
      });
  }

  // Redirect to Nylas OAuth
  export function loginWithNylas(opts?: LoginOpts) {
    opts = opts || {};
    var landingUrl = opts.landingUrl || getPath();

    return setLoginNonce()
      .then(function(loginNonce) {
        return Api.getNylasLoginUrl(opts.email, loginNonce,
          landingUrl, opts.inviteCode);
      })
      .then(function(x) {
        Log.d("Going off to " + x.url);
        location.href = x.url;
      });
  }

  // Use current pathname as default
  function getPath() {
    var path = location.pathname;
    if (path[0] === "/") {
      path = path.slice(1);
    }
    return path;
  }

  export var MISSING_NONCE = "Loging nonce missing";

  /*
    This should be triggered after callback from OAuth -- returns promise
    with loginInfo. Used as an alternate to Login.init.
  */
  export function loginOnce(uid: string) {
    var loginNonce = getLoginNonce();
    if (! loginNonce) {
      Log.e("Login nonce missing");
      return $.Deferred<ApiT.LoginResponse>()
        .reject(MISSING_NONCE)
        .promise();
    }
    return Api.loginOnce(uid, loginNonce)
      .then(function(x) {
        postCredentials(x);
        return x;
      });
  }

  /*
    Clear login data
  */
  export function logout() {
    unsetCredentials();  // Clear from memory
    clearCredentials();  // Clear from storage
    clearAllLoginInfo(); // Log out extension users
    Analytics.identify(null); // Resets identity
  }


  /* Esper extension management */

  // Pass UID and API secret to the Esper extension
  function postCredentials(x: ApiT.LoginResponse) {
    Log.d("postCredentials:", x);
    if (_.isObject(x)
        && usesGoogle(x)
        && _.isString(x.api_secret)
        && _.isString(x.uid)) {
      var esperMessage = {
        sender: "Esper",
        type: "Account",
        value: {
          googleAccountId: x.email,
          credentials: {
            apiSecret: x.api_secret,
            uid: x.uid
          },
          declined: false
        }
      };
      Log.d("esperMessage:", esperMessage);

      // Post only to same domain (this is readable by the Chrome Extension
      // but not by a hostile iFrame)
      var target = window.location.protocol + "//" + window.location.host;
      window.postMessage(esperMessage, target);
    }
  }

  // Clear all logged in users in the extension
  export function clearAllLoginInfo() {
    var esperMessage = {
      sender: "Esper",
      type: "ClearSyncStorage",
      value: {}
    };
    Log.d("esperMessage:", esperMessage);

    window.postMessage(esperMessage, "*");
  };
}
