/*
  Refactored login code for OAuth clients (Zorilla, Grison, Otter)
*/

/// <reference path="./Api.ts" />
/// <reference path="./LocalStore.ts" />
/// <reference path="./Login.ts" />

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
    opts.landingUrl = opts.landingUrl || getPath();

    return setLoginNonce()
      .then(function(loginNonce) {
        return Api.getGoogleAuthUrl(encodeLandingUrl(opts.landingUrl),
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
    opts.landingUrl = opts.landingUrl || getPath();

    return setLoginNonce()
      .then(function(loginNonce) {
        return Api.getNylasLoginUrl(opts.email, loginNonce,
          encodeLandingUrl(opts.landingUrl), opts.inviteCode);
      })
      .then(function(x) {
        Log.d("Going off to " + x.url);
        location.href = x.url;
      });
  }

  /*
    OAuth redirects currently go through Otter, so encode URLs in a form
    Otter understands to send back to external app
  */
  function encodeLandingUrl(path: string) {
    return getOrigin() + "/#!/login-once/:uid/" + Util.hexEncode(path);
  }

  function getOrigin() {
    return window.location.origin || (
      window.location.protocol + "//" + window.location.hostname +
      (window.location.port ? ':' + window.location.port: '')
    );
  }

  function getPath() {
    var ret = location.href.slice(getOrigin().length);

    // Don't include hashbang in path
    if (ret.indexOf("/#!") === 0) {
      ret = ret.slice(3);
    } else if (ret.indexOf("#!") === 0) {
      ret = ret.slice(2);
    }
    return ret;
  }


  /////

  var loginDeferred: JQueryDeferred<ApiT.LoginResponse>;

  /*
    Reset the loginDeferred object for a new login attempt, unless current
    deferred is pending.
  */
  function resetDeferred() {
    if (!loginDeferred || loginDeferred.state() !== "pending") {
      loginDeferred = $.Deferred();
    }
  }

  /*
    When resolving deferred, reset the deferred object if previously rejected.
    This fixes situation where there may be multiple ongoing log in attempts.
  */
  function resolveDeferred(info: ApiT.LoginResponse) {
    resetDeferred();
    loginDeferred.resolve(info);
  }

  /*
    Reject deferred, but not if we've already successfully logged in otherwise.
    This helps avoids race conditions with multiple ongoing log in attempts.
  */
  function rejectDeferred(err?: Error) {
    if (loginDeferred.state() === "pending") {
      loginDeferred.reject(err);
    }
  }

  /*
    Returns a promise for the current login attempt in progress.
    Promise resolves if login is successful, fails otherwise.
    Automatically initiates a login attempt if called.
  */
  export function promise() {
    if (! loginDeferred) {
      initLogin();
    }
    return loginDeferred.promise();
  }

  /*
    Registers a callback for login success -- unlike promise, these are called
    on each successful login.
  */
  export function onSuccess(cb: (info: ApiT.LoginResponse) => void) {
    loginCallbacks.push(cb);
  }
  var loginCallbacks: Array<(info: ApiT.LoginResponse) => void> = [];

  // Handle success callbacks
  function handleSuccess(info: ApiT.LoginResponse) {
    _.each(loginCallbacks, (cb) => cb(info));
  }

  // Check if there are unapproved teams that exec user needs to approve
  function needApproval(data: ApiT.LoginResponse): boolean {
    return !!_.find(data.teams || [], (team: ApiT.Team) =>
      team.team_executive === Login.me() && !team.team_approved
    );
  }

  // Set this to a function to handle teams requiring approval
  export var approvalHandler: {
    (info: ApiT.LoginResponse): JQueryPromise<ApiT.LoginResponse>;
  }

  function runLoginChecks(loginInfo: ApiT.LoginResponse)
    : JQueryPromise<ApiT.LoginResponse>|ApiT.LoginResponse
  {
    // Check if we need exec to approve teams
    if (needApproval(loginInfo) && approvalHandler) {
      return approvalHandler(loginInfo);
    } else {
      return loginInfo;
    }
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

  // Used by initLogin
  var alreadyInit = false;

  /*
    This function should be called when the app is initially loaded and we
    want to check if user has stored credentials.
  */
  export function initLogin() {
    if (alreadyInit) { return; }
    alreadyInit = true;

    resetDeferred();
    if (initCredentials()) {
      Api.getLoginInfo()
        .then(runLoginChecks)
        .then(function(loginInfo) {
          handleSuccess(loginInfo);
          resolveDeferred(loginInfo);
        }, function(err) {
          rejectDeferred(err);
        });
    } else {
      rejectDeferred();
    }
  }

  /*
    This should be triggered after callback from OAuth -- returns promise
    with loginInfo
  */
  export function loginOnce(uid: string) {
    resetDeferred();
    var loginNonce = getLoginNonce();
    return Api.loginOnce(uid, loginNonce)
      .then(function(loginInfo) {
        setCredentials(loginInfo.uid, loginInfo.api_secret);
        storeCredentials(loginInfo);
        clearLoginNonce();
        return loginInfo;
      })
      .then(runLoginChecks)
      .then(function(loginInfo) {
        handleSuccess(loginInfo);
        resolveDeferred(loginInfo);
        return loginInfo;
      }, rejectDeferred);
  }

  /*
    Call on logout to clear login data
  */
  export function clear() {
    unsetCredentials(); // Clear from memory
    clearCredentials(); // Clear from storage
    resetDeferred();
  }
}