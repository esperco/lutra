/*
  Login and team management
*/

module Login {

  export var data : any = {}; // FIXME

  export function initLoginInfo() {
    var stored = Store.get("login");

    if (stored && stored.uid) // sanity check
      data = stored;
    else
      Store.remove("login");
  };

  /* Pass UID and API secret to the Esper extension */
  function postLoginInfo() {
    var x = data;
    Log.d("postLoginInfo:", x);
    if (Util.isDefined(x)
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
      window.postMessage(esperMessage, "*");
    }
  }

  export function setLoginInfo(stored) {
    if (Conf.prod) {
      // FIXME two lines below
      window["mixpanel"].register({uid: stored.uid}); // Sent with every track()
      window["mixpanel"].track("Login");
    }

    if (!Util.isDefined(stored.team) && Util.isDefined(stored.teams[0]))
      stored.team = stored.teams[0];

    // Persistent storage never sent to the server
    Store.set("login", stored);
    data = stored;
    postLoginInfo();
  };

  function saveLoginInfo() {
    var stored = data;
    Store.set("login", stored);
  }

  export function clearLoginInfo() {
    var esperMessage = {
      sender: "Esper",
      type: "Logout",
      value: { googleAccountId: data.email }
    };
    Log.d("esperMessage:", esperMessage);
    window.postMessage(esperMessage, "*");

    Store.remove("login");
    delete data;
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
    MP.track("Logout");
    clearLoginInfo();
  };

  /*
    Set HTTP headers for authentication, assuming the user is logged in.

    The advantages over sending the api_secret as a cookie are:
    - the secret is not sent to the server
    - the signature expires, preventing replay attacks
    - all clients use the same mechanism
  */
  export function setHttpHeaders(path) {
    return function(jqXHR) {
      if (data) {
        var unixTime = Math.round(+new Date()/1000).toString();
        var signature = (<any> window["CryptoJS"]).SHA1( // FIXME
          unixTime
            + ","
            + path
            + ","
            + data.api_secret
        );
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);
      }
    }
  };

  /* Utilities */
  export function me() {
    if (Util.isDefined(data))
      return data.uid;
    else
      return;
  };

  export function isAdmin() {
    if (Util.isDefined(data))
      return data.is_admin === true;
    else
      return false;
  };

  export function isEsperAssistant() {
    if (Util.isDefined(data))
      return data.is_esper_assistant === true;
    else
      return false;
  };

  export function isExecCustomer(team) {
    if (Util.isDefined(data))
      return data.uid === team.team_executive
        && !isAdmin()
        && !isEsperAssistant();
    else
      return false;
  };

  export function myEmail() {
    if (Util.isDefined(data))
      return data.email;
    else
      return;
  };

  export function getTeams() {
    if (Util.isDefined(data))
      return data.teams;
    else
      return [];
  };

  export function getTeam() {
    if (Util.isDefined(data))
      return data.team;
  };

  export function setTeam(team) {
    data.team = team;
    saveLoginInfo();
  };

  export function organizers() {
    return getTeam().team_assistants;
  };

  export function leader() {
    return getTeam().team_executive;
  };

  export function init() {
    initLoginInfo();
    postLoginInfo();
  };

}
