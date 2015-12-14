/*
  Login and team management
*/

/// <reference path="../marten/typings/ravenjs/ravenjs.d.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/LocalStore.ts" />
/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="./Login.Post.ts" />
/// <reference path="./Util.ts" />

module Esper.Login {

  // Cache for later use
  export var data: ApiT.LoginResponse;

  interface StoredCredentials {
    uid: string;
    api_secret: string;
    email: string;
  }

  /*
    Retrieve credentials from localStorage -- we only need credentials, not
    the rest of the login_response (which we should refetch on login to
    ensure up-to-date data).
  */
  export function initCredentials() {
    var stored: StoredCredentials = LocalStore.get(storedLoginKey);
    if (stored && stored.uid && stored.api_secret) {  // sanity check
      setCredentials(stored.uid, stored.api_secret);
    } else {
      LocalStore.remove(storedLoginKey);
    }
  };

  /* Pass UID and API secret to the Esper extension */
  function postCredentials() {
    var x = data;
    Log.d("postCredentials:", x);
    if (Util.isDefined(x)
      && usesGoogle()
      && Util.isDefined(x.api_secret)
      && Util.isDefined(x.uid)) {
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

      Log.d("sending message using window.postMessage");

      // Post only to same domain (this is readable by the Chrome Extension
      // but not by a hostile iFrame)
      var target = window.location.protocol + "//" + window.location.host;
      window.postMessage(esperMessage, target);
    }
  }

  export function setLoginInfo(info: ApiT.LoginResponse) {
    // Persistent storage never sent to the server
    data = info;
    setCredentials(data.uid, data.api_secret);
    var stored: StoredCredentials = {
      uid: data.uid,
      api_secret: data.api_secret,
      email: data.email
    };
    LocalStore.set(storedLoginKey, stored);

    // Identify in analytics, then post credentials AFTER alias completes
    Analytics.identify(info, true, postCredentials);

    // Post context to Sentry
    if (info) {
      Raven.setUserContext({
        email: info.email,
        id: info.uid,
        platform: info.platform
      });
    }

    // Post credentials again after timeout in case analytics errors
    // Posting credentials twice shouldn't cause any errors
    setTimeout(postCredentials, 2000);
  };

  export function clearLoginInfo() {
    var esperMessage = {
      sender: "Esper",
      type: "Logout",
      value: { googleAccountId: data && data.email }
    };
    Log.d("esperMessage:", esperMessage);
    window.postMessage(esperMessage, "*");

    LocalStore.remove(storedLoginKey);
    data = undefined;
    unsetCredentials();

    // This will clear analytics tracking identity as appropriate
    Analytics.identify();
  };

  export function clearAllLoginInfo() {
    clearLoginInfo();
    var esperMessage = {
      sender: "Esper",
      type: "ClearSyncStorage",
      value: {}
    };
    window.postMessage(esperMessage, "*");
  };

  export function logout() {
    clearLoginInfo();
    Route.nav.home();
    location.reload();
    return false; // Allows us to use in forms or links directly and have the
                  // default browser action be suppressed
  };

  /* Utilities */
  export function isAdmin() {
    if (Util.isDefined(data))
      return data.is_admin === true;
    else
      return false;
  };

  export function isAlias() {
    if (Util.isDefined(data))
      return data.is_alias === true;
    else
      return false;
  };

  export function usesGoogle() {
    if (Util.isDefined(data))
      return data.platform === "Google";
    else
      return false;
  };

  export function usesNylas() {
    if (Util.isDefined(data))
      return data.platform === "Nylas";
    else
      return false;
  };

  export function isExecCustomer(team) {
    if (Util.isDefined(data))
      return data.uid === team.team_executive
        && !isAdmin()
        && !isAlias();
    else
      return false;
  };

  export function myEmail() {
    if (Util.isDefined(data))
      return data.email;
    else
      return;
  };

  export function getTeams(): ApiT.Team[] {
    if (Util.isDefined(data))
      return data.teams;
    else
      return [];
  };

}
