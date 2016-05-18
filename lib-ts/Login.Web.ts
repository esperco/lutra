/*
  Refactored login code for OAuth clients (Zorilla, Grison, Otter)
*/

/// <reference path="./Api.ts" />
/// <reference path="./LocalStore.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Analytics.Web.ts" />

module Esper.Login {
  var storedLoginKey = "login";

  export interface StoredCredentials {
    uid: string;
    api_secret: string;
    email: string;
  }

  interface CredentialsObj {
    uid: string;
    api_secret: string;
    email: string;
  }

  export function storeCredentials(data: ApiT.LoginResponse|CredentialsObj) {
    var stored: StoredCredentials = {
      uid: data.uid,
      api_secret: data.api_secret,
      email: data.email
    };
    LocalStore.set(storedLoginKey, stored);
  }

  export function clearCredentials() {
    LocalStore.remove(storedLoginKey);
  }

  export function getCredentials(): StoredCredentials {
    return LocalStore.get(storedLoginKey);
  }

  /*
    Retrieve credentials from localStorage -- we only need credentials, not
    the rest of the login_response (which we should refetch on login to
    ensure up-to-date data).
  */
  export function initCredentials() {
    var stored = getCredentials();
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

  type infoKey = "";
  export var InfoStore = new Model2.Store<infoKey, ApiT.LoginResponse>();

  // Used by init
  var alreadyInit = false;

  /*
    This function should be called when the app is initially loaded and we
    want to check if user has stored credentials.
  */
  export function init() {
    if (alreadyInit) { return; }
    alreadyInit = true;

    if (initCredentials()) {
      Api.getLoginInfo().then(onLoginSuccess, onLoginFailure);
    } else {
      goToLogin();
    }
  }

  // Used for testing
  export function reset() {
    alreadyInit = false;
    loginDeferred = $.Deferred();
    promise = loginDeferred.promise();
    InfoStore.reset();
    InfoStore.removeAllChangeListeners();
    unsetCredentials();
  }

  // Set scope for use in other
  export function setLoginInfo(loginInfo: ApiT.LoginResponse) {
    Analytics.identify(loginInfo);
    if ((<any> window).Raven) {
      Raven.setUserContext({
        email: loginInfo.email,
        id: loginInfo.uid,
        platform: loginInfo.platform
      });
    }
    InfoStore.set("", Option.wrap(loginInfo), {
      dataStatus: Model2.DataStatus.READY
    });
    Login.data = loginInfo; // Compat with legacy code
  }

  export function getLoginInfo() {
    return InfoStore.get("")
      .flatMap((storeData) => storeData.data);
  }

  export function getStatus() {
    return InfoStore.get("").match({
      none: () => Model2.DataStatus.FETCH_ERROR,
      some: (d) => d.dataStatus
    });
  }

  function onLoginSuccess(loginInfo: ApiT.LoginResponse) {
    // Remove ignored teams
    var teamIds = getIgnoredTeams();
    loginInfo.teams = _.filter(loginInfo.teams, (t) => {
      return !_.includes(teamIds, t.teamid);
    })

    if (needApproval(loginInfo)) {
      goToLogin({error: "For security reasons, please log in again."});
      return;
    } else {
      setLoginInfo(loginInfo);
      loginDeferred.resolve(loginInfo);
      return loginInfo;
    }
  }

  function onLoginFailure(err?: Error) {
    Log.e(err);
    goToLogin({error: "There was an error logging you in. Please try again."});
  }

  // Check if there are unapproved teams that exec user needs to approve
  export function needApproval(data: ApiT.LoginResponse): boolean {
    return !!_.find(data.teams || [], (team: ApiT.Team) =>
      team.team_executive === Login.me() && !team.team_approved
    );
  }


  /////

  // Requires admin permission
  export function loginAs(email: string) {
    Api.loginAs(email)
      .done(function(loginResponse) {
        storeCredentials(loginResponse);
        location.reload();
      });
  }


  /////

  // Store a list of ignored team ids (e.g. rejected for lack of approval)
  // We eventually want to review and remove these teams from the DB (but
  // this lets a user with unapproved teams continue to use the site)

  var ignoredTeamsKey = "ignored";
  export function ignoreTeamIds(teamIds: string[]) {
    LocalStore.set(ignoredTeamsKey, teamIds);
  }

  export function getIgnoredTeams() {
    return LocalStore.get(ignoredTeamsKey) || [];
  }

  export function clearIgnoredTeams() {
    LocalStore.remove(ignoredTeamsKey);
  }


  //////

  // Params for redirect
  export var uidParam = "uid";
  export var redirectParam = "redirect";
  export var messageParam = "msg";
  export var errorParam = "err";
  export var logoutParam = "logout";
  export var emailParam = "email";
  export var inviteParam = "invite";
  export var tokenParam = "token";
  export var extParam = "ext";
  export var platformParam = "platform"; // Google / Exchange / Nylas

  // Redirects
  export var loginPath = "/login";

  export function goToLogin(opts: {
      message?: string,
      error?: string,
      email?: string,
      invite?: string,
      redirect?: string,
      token?: string
    } = {})
  {
    var params: {[index: string]: string} = {};
    params[messageParam] = opts.message;
    params[errorParam] = opts.error;
    params[emailParam] = opts.email;
    params[inviteParam] = opts.invite;

    // Absence of redirect property means default to current path
    // If redirect is present but falsey, then we just use the login page's
    // default redirect option
    if (opts.hasOwnProperty("redirect")) {
      params[redirectParam] = opts.redirect;
    } else {
      params[redirectParam] = getRedirectParam();
    }

    params[tokenParam] = opts.token;
    goToLoginParams(params);
  }

  export function goToLogout(message?: string) {
    var params: {[index: string]: string} = {};
    if (message) { params[messageParam] = message; }
    params[logoutParam] = "1";
    goToLoginParams(params);
  }

  // For Google extension users only
  export function extLogin(email: string) {
    var params: {[index: string]: string} = {};
    params[emailParam] = email;
    params[extParam] = "1";
    goToLoginParams(params);
  }

  function getRedirectParam() {
    return Util.hexEncode(location.pathname + location.hash);
  }

  function goToLoginParams(params: {[index: string]: string}) {
    var path = loginPath;
    var paramsStr = _.map(params, function(v, k) {
      if (v) {
        return k + "=" + encodeURIComponent(v)
      }
    });
    paramsStr = _.filter(paramsStr);

    if (paramsStr.length) {
      path += "?" + paramsStr.join("&");
    }
    location.href = path;
    return;
  }



  /* Utilities mostly used by Otter */

  // Set to provide default for utils
  export var data: ApiT.LoginResponse;

  export function isAdmin(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.is_admin === true;
    else
      return false;
  };

  export function isAlias(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.is_alias === true;
    else
      return false;
  };

  export function usesGoogle(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.platform === "Google";
    else
      return false;
  };

  export function usesNylas(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.platform === "Nylas";
    else
      return false;
  };

  export function isExecCustomer(team: ApiT.Team, x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.uid === team.team_executive
        && !isAdmin()
        && !isAlias();
    else
      return false;
  };

  export function myEmail(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.email;
    else
      return;
  };

  export function getTeams(x?: ApiT.LoginResponse): ApiT.Team[] {
    x = x || data;
    if (! _.isUndefined(x))
      return x.teams;
    else
      return [];
  };
}
