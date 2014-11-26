/*
  API client
*/

module Api {

  // HTTP - response body is interpreted as JSON

  function jsonHttp(method, url, body) {

    function logError(xhr, textStatus, err) {
      var respBody = xhr.responseText;
      var details = {
        code: xhr.status,
        textStatus: textStatus,
        method: method,
        url: url,
        reqBody: body,
        respBody: respBody
      };
      Status.reportError(respBody);
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

  export function getLoginInfo()
    : JQueryDeferred<ApiT.LoginResponse>
  {
    return jsonHttpGet("/api/login/" + Login.me() + "/info");
  };

  export function loginOnce(uid, loginNonce)
    : JQueryDeferred<ApiT.LoginResponse>
  {
    return jsonHttpPost("/api/login/" + uid + "/once/" + loginNonce, "");
  };

  export function random()
    : JQueryDeferred<ApiT.Random>
  {
    return jsonHttpPost("/api/random", "");
  };

  /*** Esper team management ***/

  export function inviteCreateTeam()
    : JQueryDeferred<ApiT.UrlResult>
  {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return jsonHttpPost("/api/invite/" + fromUid + "/create-team",
                        JSON.stringify(invite));
  };

  export function inviteJoinTeam(invite)
    : JQueryDeferred<ApiT.UrlResult>
  {
    return jsonHttpPost("/api/invite/" + Login.me() + "/join-team",
                        JSON.stringify(invite));
  };

  export function setTeamName(teamid, name):
  JQueryDeferred<void> {
    var fromUid = Login.me();
    return jsonHttpPut("/api/team-name/" + fromUid
                       + "/" + teamid
                       + "/" + name,
                       "");
  };

  export function setExecutive(teamid, memberUid)
    : JQueryDeferred<void>
  {
    return jsonHttpPut("/api/team/" + Login.me() + "/" + teamid
                       + "/executive/" + memberUid, "");
  };

  export function removeAssistant(teamid, memberUid)
    : JQueryDeferred<void>
  {
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
  export function postToken(token)
    : JQueryDeferred<ApiT.LoginResponse>
  {
    return jsonHttpPost("/api/token/" + encodeURIComponent(token), "");
  };


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl,
                                  optLoginNonce,
                                  optInvite,
                                  optEmail)
    : JQueryDeferred<ApiT.UrlResult>
  {
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

  export function getGoogleAuthInfo(optAuthLandingUrl)
    : JQueryDeferred<any> // FIXME
  {
    var url = "/api/google/" + Login.me() + "/auth/info";
    if (Util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  export function postGoogleAuthRevoke()
    : JQueryDeferred<any> // FIXME
  {
    var url = "/api/google/" + Login.me() + "/auth/revoke";
    return jsonHttpPost(url, "");
  };


  /***** Team label syncing *****/

  export function getSyncedLabels(teamid)
    : JQueryDeferred<ApiT.EmailLabels>
  {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpGet(url);
  };

  export function putSyncedLabels(teamid, labels)
    : JQueryDeferred<void>
  {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpPut(url, JSON.stringify(labels));
  };

  export function getSharedLabels(teamid)
    : JQueryDeferred<ApiT.EmailLabels>
  {
    var url = "/api/labels/shared/" + teamid;
    return jsonHttpGet(url);
  };

  /***** Google profile information *****/

  export function getGoogleEmail(myUID, theirUID, teamid)
    : JQueryDeferred<ApiT.AccountEmail>
  {
    var url = "/api/google/email/" + myUID + "/" + theirUID + "/" + teamid;
    return jsonHttpGet(url);
  };

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + Login.data.uid;
  }

  export function getProfile(uid, teamid)
    : JQueryDeferred<ApiT.Profile>
  {
    return jsonHttpGet(apiProfilePrefix()
                       + "/" + uid
                       + "/" + teamid);
  };

  export function getMyProfile() {
    return jsonHttpGet(apiProfilePrefix() + "/me");
  };


  /*** Scheduling ***/

  export function getCalendarList()
    : JQueryDeferred<ApiT.Calendars>
  {
    var url = "api/calendar/list/" + Login.data.uid;
    return jsonHttpGet(url);
  };

  export function getCalendarShares(calid)
    : JQueryDeferred<ApiT.CalendarAcl>
  {
    var url = "api/calendar/share/list/"
      + Login.data.uid + "/"
      + encodeURIComponent(calid);
    return jsonHttpGet(url);
  };

  export function putCalendarShare(calid, email)
    : JQueryDeferred<void>
  {
    var url = "api/calendar/share/add/"
      + Login.data.uid + "/"
      + encodeURIComponent(calid) + "/"
      + encodeURIComponent(email);
    return jsonHttpPut(url, "");
  };

  export function deleteCalendarShare(calid, rule_id)
    : JQueryDeferred<void>
  {
    var url = "api/calendar/share/remove/"
      + Login.data.uid + "/"
      + encodeURIComponent(calid) + "/"
      + encodeURIComponent(rule_id);
    return jsonHttpDelete(url);
  };

  export function putTeamCalendars(teamid, cals)
    : JQueryDeferred<void>
  {
    var url = "api/team/" + Login.data.uid
      + "/" + teamid + "/calendars";
    return jsonHttpPut(url, JSON.stringify(cals));
  };

  export function putTeamEmails(teamid, aliases)
    : JQueryDeferred<ApiT.EmailAddresses>
  {
    var url = "api/team/" + Login.data.uid
      + "/" + teamid + "/emails";
    return jsonHttpPut(url, JSON.stringify(aliases));
  };

  export function putAccountEmails(teamid, theirUID, aliases)
    : JQueryDeferred<ApiT.EmailAddresses>
  {
    var url = "api/account/emails/" + Login.data.uid
      + "/" + teamid + "/" + theirUID;
    return jsonHttpPut(url, JSON.stringify(aliases));
  };

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export function setPreferences(teamid, preferences)
    : JQueryDeferred<void>
  {
    var url = "/api/preferences/" + Login.me() + "/" + teamid;
    return jsonHttpPut(url, JSON.stringify(preferences));
  }

  /** The preferences currently saved for the given team executive, as
   *  a JSON object.
   */
  export function getPreferences(teamid)
    : JQueryDeferred<ApiT.Preferences>
  {
    var url = "/api/preferences/" + Login.me() + "/" + teamid;

    return jsonHttpGet(url);
  }

  /*** Payment Information ***/

  /** The status of an executive as a JSON object **/

  export function getSubscriptionStatus(uid, teamid)
    : JQueryDeferred<ApiT.CustomerStatus>
  {
      var url = "/api/pay/status/short/" + uid + "/" + teamid;

      return jsonHttpGet(url);
  }

  /** Sets the subscription for an exec **/
  export function setSubscription(uid, teamid, planid)
  : JQueryDeferred<void>
  {
    var url = "/api/pay/subscribe/" + uid + "/" + teamid + "/" + planid;

    return jsonHttpPost(url, "");

  }


}
