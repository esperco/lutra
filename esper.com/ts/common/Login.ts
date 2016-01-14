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
  var storedLoginKey = "login";

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

  export function clearCredentials() {
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

  /*
    This function should be called when the app is initially loaded and we
    want to check if user has stored credentials.
  */
  export function init(force=false) {
    if (alreadyInit && !force) { return; }
    alreadyInit = true;

    if (initCredentials()) {
      Api.getLoginInfo().then(onLoginSuccess, onLoginFailure);
    } else {
      goToLogin();
    }
  }

  function onLoginSuccess(loginInfo: ApiT.LoginResponse) {
    // Remove ignored teams
    var teamIds = getIgnoredTeams();
    loginInfo.teams = _.filter(loginInfo.teams, (t) => {
      return !_.contains(teamIds, t.teamid);
    })

    if (needApproval(loginInfo)) {
      goToLogin(null, "For security reasons, please log in again.");
    } else {
      storeCredentials(loginInfo);
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
      return loginInfo;
    }
  }

  function onLoginFailure(err?: Error) {
    Log.e(err);
    goToLogin(null, "There was an error logging you in. Please try again.");
  }

  // Check if there are unapproved teams that exec user needs to approve
  export function needApproval(data: ApiT.LoginResponse): boolean {
    return !!_.find(data.teams || [], (team: ApiT.Team) =>
      team.team_executive === Login.me() && !team.team_approved
    );
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

  // Redirects
  export var loginPath = "/login";

  export function goToLogin(message?: string, error?: string) {
    var params: {[index: string]: string} = {};
    params[messageParam] = message;
    params[errorParam] = error;
    params[redirectParam] = getRedirectParam();
    goToLoginParams(params);
  }

  export function goToLogout(message?: string) {
    var params: {[index: string]: string} = {};
    params[messageParam] = message;
    params[logoutParam] = "1";
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
  }
}
