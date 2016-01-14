/*
  Refactored login code for OAuth clients (Zorilla, Grison, Otter)
*/

/// <reference path="../typings/ravenjs/ravenjs.d.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/LocalStore.ts" />
/// <reference path="../lib/Login.ts" />
/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Analytics.Web.ts" />

module Esper.Login {
  var nonceKey = "login_nonce";
  var storedLoginKey = "login";

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


  /////

  export interface StoredCredentials {
    uid: string;
    api_secret: string;
    email: string;
  }

  export function storeCredentials(data: ApiT.LoginResponse) {
    var stored: StoredCredentials = {
      uid: data.uid,
      api_secret: data.api_secret,
      email: data.email
    };
    LocalStore.set(storedLoginKey, stored);
  }

  function clearCredentials() {
    LocalStore.remove(storedLoginKey);
  };

  /*
    Retrieve credentials from localStorage -- we only need credentials, not
    the rest of the login_response (which we should refetch on login to
    ensure up-to-date data).
  */
  function initCredentials() {
    var stored: StoredCredentials = LocalStore.get(storedLoginKey);
    if (stored && stored.uid && stored.api_secret) {  // sanity check
      setCredentials(stored.uid, stored.api_secret);
      return true;
    } else {
      clearCredentials();
      return false;
    }
  }

  var loginDeferred: JQueryDeferred<ApiT.LoginResponse> = $.Deferred();
  export var promise = loginDeferred.promise();
  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  // Used by init
  var alreadyInit = false;

  // Change before calling init for approve-teams page
  export var allowUnapproved = false;

  /*
    This function should be called when the app is initially loaded and we
    want to check if user has stored credentials.
  */
  export function init() {
    if (alreadyInit) { return; }
    alreadyInit = true;

    // Check query param for uid
    var uid = Util.getParamByName("uid");

    if (initCredentials() && (!uid || Login.myUid() === uid)) {
      Api.getLoginInfo().then(onLoginSuccess, onLoginFailure);
    } else if (uid) {
      loginOnce(uid);
    } else {
      goToLogin();
    }
  }

  function onLoginSuccess(loginInfo: ApiT.LoginResponse) {
    if (needApproval(loginInfo) && !allowUnapproved) {
      goToApproveTeams();
    } else {
      Analytics.identify(loginInfo, true);
      if ((<any> window).Raven) {
        Raven.setUserContext({
          email: loginInfo.email,
          id: loginInfo.uid,
          platform: loginInfo.platform
        });
      }
      InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
      loginDeferred.resolve(loginInfo);
    }
  }

  function onLoginFailure(err?: Error) {
    Log.e(err);
    goToLogin(null, "There was an error logging you in. Please try again.");
  }

  // Check if there are unapproved teams that exec user needs to approve
  function needApproval(data: ApiT.LoginResponse): boolean {
    return !!_.find(data.teams || [], (team: ApiT.Team) =>
      team.team_executive === Login.me() && !team.team_approved
    );
  }

  /*
    This should be triggered after callback from OAuth -- returns promise
    with loginInfo
  */
  export function loginOnce(uid: string) {
    var loginNonce = getLoginNonce();
    if (! loginNonce) {
      Log.e("Login nonce missing");
      goToLogin();
    }
    return Api.loginOnce(uid, loginNonce).then(onLoginSuccess, onLoginFailure);
  }

  /*
    Clear login data
  */
  export function logout() {
    unsetCredentials(); // Clear from memory
    clearCredentials(); // Clear from storage
    Analytics.identify(null); // Resets identity
  }


  // Redirects
  export var loginPath = "/login";
  export var logoutPath = "/login?logout=1"
  export var approveTeamsPath = "/approve-teams";

  export function goToLogin(message?: string, error?: string) {
    var path = loginPath;
    var params: string[] = [];
    if (message) {
      params.push("message=" + encodeURIComponent(message));
    }
    if (error) {
      params.push("error=" + encodeURIComponent(error));
    }
    if (params.length) {
      path += "?" + params.join("&");
    }
    location.href = path;
  }

  export function goToLogout(message?: string) {
    var path = logoutPath;
    if (message) {
      path += "?message" + encodeURIComponent(message);
    }
    location.href = path;
  }

  export function goToApproveTeams() {
    location.href = approveTeamsPath;
  }
}
