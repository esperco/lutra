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
    extension?: boolean;
  }

  // Redirect to Google OAuth
  export function loginWithGoogle(opts?: LoginOpts)
  {
    opts = opts || {};
    var landingUrl = opts.landingUrl || getPath();

    return setLoginNonce()
      .then(function(loginNonce) {
        return Api.getGoogleAuthUrl(landingUrl,
          loginNonce, opts.inviteCode, opts.email, opts.extension);
      })
      .then(function(x) {
        Log.d("Going off to " + x.url);
        location.href = x.url;
      });
  }

  // Second check to see if we need more Google Oauth permissions
  export function checkGooglePermissions(landingUrl: string) {
    // Landing URL => prefix with base URL (landingUrl format for
    // getGoogleAuthInfo is a little different than getGoogleAuthUrl)
    landingUrl = location.origin + "/" + landingUrl;

    return Api.getGoogleAuthInfo(landingUrl)
      .then(function(info) {
        if (info.need_google_auth) {
          Log.d("Going off to " + info.google_auth_url);
          location.href = info.google_auth_url;

          // Return promise that never resolves so callbacks don't trigger
          // while redirect is happening
          return $.Deferred().promise();
        }
        else
          return true;
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
    return Api.loginOnce(uid, loginNonce);
  }

  /*
    Clear login data
  */
  export function logout() {
    unsetCredentials();  // Clear from memory
    clearCredentials();  // Clear from storage
    Analytics.identify(null); // Resets identity
  }
}
