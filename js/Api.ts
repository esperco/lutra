/*
  API client
*/

module Api {

  // HTTP - response body is interpreted as JSON

  function jsonHttp(method, url, body) {

    function logError(xhr, textStatus, err) {
      var details = {
        code: xhr.status,
        textStatus: textStatus,
        method: method,
        url: url,
        reqBody: body,
        respBody: xhr.responseText
      };
      switch (xhr.status) {
      case 400:
        Log.p("Bad request", details);
        break;
      case 401:
        Log.p("Unauthorized", details);
        break;
      case 403:
        Log.p("Forbidden", details);
        break;
      case 404:
        Log.p("Not found", details);
        break;
      case 500: /* Server error */
        Log.p("Server error", details);
        break;
      default: /* Fallback */
        Log.p("Unknown error " + xhr.status, details);
      }
    }

    /*
      We return a Deferred object.
      Use .done(function(result){...}) to access the result.
      (see jQuery documentation)
    */
    var request = {
      url: url,
      type: method,
      data: body,
      dataType: "json",
      beforeSend: Login.setHttpHeaders(url)
    };
    if (body && body.length > 0) {
      request["contentType"] = "application/json; charset=UTF-8";
    }
    return $.ajax(request)
            .fail(logError);
  }

  function jsonHttpGet(url) {
    return jsonHttp("GET", url, null);
  }

  function jsonHttpPost(url, body) {
    return jsonHttp("POST", url, body);
  }

  function jsonHttpPut(url, body) {
    return jsonHttp("PUT", url, body);
  }

  function jsonHttpDelete(url) {
    return jsonHttp("DELETE", url, null);
  }

  /*
    ["foo=123", "bar=abc"] -> "?foo=123&bar=abc"
    [] -> ""
  */
  function makeQuery(argArray) {
    var s = argArray.join("&");
    if (argArray.length > 0)
      s = "?" + s;
    return s;
  }

  /********************************* API ***************************/


  /* Esper login and password management */

  export function getLoginInfo() {
    return jsonHttpGet("/api/login/" + Login.me() + "/info");
  };

  export function loginOnce(uid, loginNonce) {
    return jsonHttpPost("/api/login/" + uid + "/once/" + loginNonce, "");
  };

  export function random() {
    return jsonHttpPost("/api/random", "");
  };

  /*** Esper team management ***/

  export function inviteCreateTeam() {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return jsonHttpPost("/api/invite/" + fromUid + "/create-team",
                        JSON.stringify(invite));
  };

  export function inviteJoinTeam(invite) {
    return jsonHttpPost("/api/invite/" + Login.me() + "/join-team",
                        JSON.stringify(invite));
  };

  export function setExecutive(teamid, memberUid) {
    return jsonHttpPut("/api/team/" + Login.me() + "/" + teamid
                       + "/executive/" + memberUid, "");
  };

  export function removeAssistant(teamid, memberUid) {
    return jsonHttpDelete("/api/team/" + Login.me() + "/" + teamid
                          + "/member/" + memberUid);
  };

  /***** Opaque URLs with unique token *****/

  /*
    Post an opaque token provided in a URL of the form:

      https://app.esper.com/#!t/XXXXXX

    The response describes what has be done and what can be done next.
    This is used for invites and other URLs that are given out to users.
   */
  export function postToken(token) {
    return jsonHttpPost("/api/token/" + encodeURIComponent(token), "");
  };


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl,
                                  optLoginNonce,
                                  optInvite,
                                  optEmail) {
    var url = "/api/google-auth-url";
    var q = [];
    if (Util.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    if (Util.isString(optLoginNonce))
      q.push("login_nonce=" + encodeURIComponent(optLoginNonce));
    if (Util.isString(optInvite))
      q.push("invite=" + encodeURIComponent(optInvite));
    if (Util.isString(optEmail))
      q.push("login_hint=" + encodeURIComponent(optEmail));
    url = url + makeQuery(q);
    return jsonHttpGet(url);
  };

  export function getGoogleAuthInfo(optAuthLandingUrl) {
    var url = "/api/google/" + Login.me() + "/auth/info";
    if (Util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  export function postGoogleAuthRevoke() {
    var url = "/api/google/" + Login.me() + "/auth/revoke";
    return jsonHttpPost(url, "");
  };


  /***** Team label syncing *****/

  export function getSyncedLabels(teamid) {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpGet(url);
  };

  export function putSyncedLabels(teamid, labels) {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpPut(url, JSON.stringify(labels));
  };

  export function getSharedLabels(teamid) {
    var url = "/api/labels/shared/" + teamid;
    return jsonHttpGet(url);
  };

  /***** Team calendar *****/

  export function setTeamCalendar(teamid, calId) {
    var url = "/api/calendar/select/" + Login.me() + "/" + teamid;
    var data = { calendar_id: calId };
    return jsonHttpPut(url, JSON.stringify(data));
  }

  /***** Google profile information *****/

  export function getGoogleEmail(myUID, theirUID, teamid) {
    var url = "/api/google/email/" + myUID + "/" + theirUID + "/" + teamid;
    return jsonHttpGet(url);
  };

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + Login.data.uid;
  }

  function apiQPrefix() {
    return "/api/q/" + Login.data.uid;
  }

  function api_tasks_prefix() {
    return apiQPrefix() + "/tasks/" + Login.getTeam().teamid;
  }

  function apiTaskProfilePrefix() {
    return apiQPrefix() + "/profile";
  }

  export function getProfile(uid, teamid) {
    return jsonHttpGet(apiProfilePrefix()
                       + "/" + uid
                       + "/" + teamid);
  };

  export function getMyProfile() {
    return jsonHttpGet(apiProfilePrefix() + "/me");
  };


  /*** Scheduling ***/

  export function getCalendarList() {
    var url = "api/calendar/list/" + Login.data.uid;
    return jsonHttpGet(url);
  };

  export function putTeamCalendars(teamid, cals) {
    var url = "api/team/" + Login.data.uid
      + "/" + teamid + "/calendars";
    return jsonHttpPut(url, JSON.stringify(cals));
  };

  export function putTeamEmails(teamid, aliases) {
    var url = "api/team/" + Login.data.uid
      + "/" + teamid + "/emails";
    return jsonHttpPut(url, JSON.stringify(aliases));
  };

  /*** Executive Preferences ***/
  
  /** Sets the preferences given the correct JSON object. */
  export function setPreferences(teamid, preferences) {
    var url = "/api/preferences/" + Login.me() + "/" + teamid;
    return jsonHttpPut(url, JSON.stringify(preferences));
  }

  /** The preferences currently saved for the given team executive, as
   *  a JSON object.
   */
  export function getPreferences(teamid) {
    var url = "/api/preferences/" + Login.me() + "/" + teamid;

    return jsonHttpGet(url);
  }

}
