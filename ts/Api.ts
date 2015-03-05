/*
  API client
*/

module Api {

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.
  */
  function string(x: string) {
    console.assert(x !== undefined && x !== null);
    return x;
  }

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
    return jsonHttpGet("/api/login/" + string(Login.me()) + "/info");
  };

  export function loginOnce(uid, loginNonce)
    : JQueryDeferred<ApiT.LoginResponse>
  {
    return jsonHttpPost("/api/login/" + string(uid)
                        + "/once/" + string(loginNonce), "");
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
    return jsonHttpPost("/api/invite/" + string(fromUid) + "/create-team",
                        JSON.stringify(invite));
  };

  export function inviteJoinTeam(invite)
    : JQueryPromise<void>
  {
    return jsonHttpPost("/api/invite/" + string(Login.me()) + "/join-team",
                        JSON.stringify(invite))
      .then(function(_ignored) {});
  };

  export function setTeamName(teamid, name):
  JQueryDeferred<void> {
    var fromUid = Login.me();
    return jsonHttpPut("/api/team-name/" + string(fromUid)
                       + "/" + string(teamid)
                       + "/" + string(name),
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
    return jsonHttpDelete("/api/team/" + string(Login.me())
                          + "/" + string(teamid)
                          + "/member/" + string(memberUid));
  };

  /***** Opaque URLs with unique token *****/

  /*
    Post an opaque token provided in a URL of the form:

      https://app.esper.com/#!t/XXXXXX

    The response describes what has be done and what can be done next.
    This is used for invites and other URLs that are given out to users.
   */
  export function postToken(token)
  : JQueryDeferred<ApiT.TokenInfo>
  {
    return jsonHttpPost("/api/token/" + encodeURIComponent(string(token)), "");
  };

  export function postTokenEmail(token: string, email: string, name: string)
  : JQueryDeferred<ApiT.TokenInfo>
  {
    var path =
      "/api/token-email/" + encodeURIComponent(string(token))
      + "/" + encodeURIComponent(string(email))
      + "/" + encodeURIComponent(string(name));
    return jsonHttpPost(path, "");
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
    : JQueryDeferred<ApiT.GoogleAuthInfo>
  {
    var url = "/api/google/" + string(Login.me()) + "/auth/info";
    if (Util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  export function postGoogleAuthRevoke()
    : JQueryDeferred<any> // FIXME
  {
    var url = "/api/google/" + string(Login.me()) + "/auth/revoke";
    return jsonHttpPost(url, "");
  };


  /***** Team label syncing *****/

  export function getSyncedLabels(teamid)
    : JQueryDeferred<ApiT.EmailLabels>
  {
    var url = "/api/labels/synced/" + string(teamid);
    return jsonHttpGet(url);
  };

  export function putSyncedLabels(teamid, labels)
    : JQueryDeferred<void>
  {
    var url = "/api/labels/synced/" + string(teamid);
    return jsonHttpPut(url, JSON.stringify(labels));
  };

  export function getSharedLabels(teamid)
    : JQueryDeferred<ApiT.EmailLabels>
  {
    var url = "/api/labels/shared/" + string(teamid);
    return jsonHttpGet(url);
  };

  /***** Google profile information *****/

  export function getGoogleEmail(myUID, theirUID, teamid)
    : JQueryDeferred<ApiT.AccountEmail>
  {
    var url =
      "/api/google/email/" + string(myUID)
      + "/" + string(theirUID)
      + "/" + string(teamid);
    return jsonHttpGet(url);
  };

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + string(Login.data.uid);
  }

  export function getProfile(uid, teamid)
    : JQueryDeferred<ApiT.Profile>
  {
    return jsonHttpGet(apiProfilePrefix()
                       + "/" + string(uid)
                       + "/" + string(teamid));
  };

  export function getMyProfile() {
    return jsonHttpGet(apiProfilePrefix() + "/me");
  };


  /*** Scheduling ***/

  export function getCalendarList()
    : JQueryDeferred<ApiT.Calendars>
  {
    var url = "api/calendar/list/" + string(Login.data.uid);
    return jsonHttpGet(url);
  };

  export function getCalendarShares(calid)
    : JQueryDeferred<ApiT.CalendarAcl>
  {
    var url = "api/calendar/share/list/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(calid));
    return jsonHttpGet(url);
  };

  export function putCalendarShare(calid, email)
    : JQueryDeferred<void>
  {
    var url = "api/calendar/share/add/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(calid)) + "/"
      + encodeURIComponent(string(email));
    return jsonHttpPut(url, "");
  };

  export function deleteCalendarShare(calid, rule_id)
    : JQueryDeferred<void>
  {
    var url = "api/calendar/share/remove/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(calid)) + "/"
      + encodeURIComponent(string(rule_id));
    return jsonHttpDelete(url);
  };

  export function createTeamCalendar(teamid, name)
    : JQueryDeferred<void>
  {
    var url = "api/calendar/share/create/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(teamid)) + "/"
      + encodeURIComponent(string(name));
    return jsonHttpPost(url, "");
  };

  export function putTeamCalendars(teamid, cals)
    : JQueryDeferred<void>
  {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/calendars";
    return jsonHttpPut(url, JSON.stringify(cals));
  };

  export function putTeamEmails(teamid, aliases)
    : JQueryDeferred<ApiT.EmailAddresses>
  {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/emails";
    return jsonHttpPut(url, JSON.stringify(aliases));
  };

  export function putAccountEmails(teamid, theirUID, aliases)
    : JQueryDeferred<ApiT.EmailAddresses>
  {
    var url = "api/account/emails/" + string(Login.data.uid)
      + "/" + string(teamid) + "/" + string(theirUID);
    return jsonHttpPut(url, JSON.stringify(aliases));
  };

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export function setPreferences(teamid, preferences)
    : JQueryDeferred<void>
  {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return jsonHttpPut(url, JSON.stringify(preferences));
  }

  /** The preferences currently saved for the given team executive, as
   *  a JSON object.
   */
  export function getPreferences(teamid)
    : JQueryDeferred<ApiT.Preferences>
  {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  /*** Payment Information ***/

  /** Gets the status of a team **/
  export function getSubscriptionStatus(teamid)
    : JQueryDeferred<ApiT.CustomerStatus>
  {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpGet(url);
  }
  /** Gets the long status of a team, including cc info **/
  export function getSubscriptionStatusLong(teamid)
    : JQueryDeferred<ApiT.CustomerDetails>
  {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);

      return jsonHttpGet(url);
  }

  /** Sets the subscription for a team **/
  export function setSubscription(teamid, planid)
  : JQueryDeferred<void>
  {
    var url = "/api/pay/subscribe/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(planid);
    return jsonHttpPost(url, "");
  }

  /** Cancels a team's subscriptions **/
  export function cancelSubscription(teamid)
  : JQueryDeferred<void>
  {
    var url = "/api/pay/unsubscribe/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpPost(url, "");
  }

  /** Add a new card to the Stripe account using the one-time token
    * obtained by the client from Stripe directly. This doesn't change the
    * customer's default card if there was one already. **/
  export function addNewCard(teamid, cardToken)
  : JQueryDeferred<ApiT.PaymentCard>
  {
    var url = "/api/pay/new-card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(cardToken));
    return jsonHttpPost(url, "");
  }

  /** Deletes a credit card **/
  export function deleteCard(teamid, cardid)
  : JQueryDeferred<void>
  {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return jsonHttpDelete(url);
  }

  /** Sets the default card **/
  export function setDefaultCard(teamid, cardid)
  : JQueryDeferred<void>
  {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return jsonHttpPut(url,"");
  }

  export function getSignature(teamid, theirUid)
    : JQueryDeferred<ApiT.EmailSignature>
  {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return jsonHttpGet(url);
  }

  export function setSignature(teamid, theirUid, sig : ApiT.EmailSignature)
    : JQueryDeferred<void>
  {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return jsonHttpPut(url, JSON.stringify(sig));
  }

}
