/*
  API client
*/

var api = (function () {

  var mod = {};

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
        log("Bad request", details);
        break;
      case 401:
        log("Unauthorized", details);
        break;
      case 403:
        log("Forbidden", details);
        break;
      case 404:
        log("Not found", details);
        break;
      case 500: /* Server error */
        log("Server error", details);
        break;
      default: /* Fallback */
        log("Unknown error " + xhr.status, details);
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
      beforeSend: login.setHttpHeaders(url)
    };
    if (body && body.length > 0) {
      request.contentType = "application/json; charset=UTF-8";
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

  mod.getLoginInfo = function() {
    return jsonHttpGet("/api/login/" + login.me() + "/info");
  };

  mod.loginOnce = function(uid, loginNonce) {
    return jsonHttpPost("/api/login/" + uid + "/once/" + loginNonce);
  };

  mod.random = function() {
    return jsonHttpPost("/api/random");
  };

  /*** Esper invites ***/

  mod.inviteJoinTeam = function(invite) {
    return jsonHttpPost("/api/invite/" + login.me() + "/join-team",
                        JSON.stringify(invite));
  };

  /***** Opaque URLs with unique token *****/

  /*
    Post an opaque token provided in a URL of the form:

      https://app.esper.com/#!t/XXXXXX

    The response describes what has be done and what can be done next.
    This is used for invites and other URLs that are given out to users.
   */
  mod.postToken = function(token) {
    return jsonHttpPost("/api/token/" + encodeURIComponent(token));
  };


  /***** Google authentication and permissions *****/

  mod.getGoogleAuthUrl = function(optAuthLandingUrl,
                                  optLoginNonce,
                                  optInvite,
                                  optEmail) {
    var url = "/api/google-auth-url";
    var q = [];
    if (util.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    if (util.isString(optLoginNonce))
      q.push("login_nonce=" + encodeURIComponent(optLoginNonce));
    if (util.isString(optInvite))
      q.push("invite=" + encodeURIComponent(optInvite));
    if (util.isString(optEmail))
      q.push("login_hint=" + encodeURIComponent(optEmail));
    url = url + makeQuery(q);
    return jsonHttpGet(url);
  };

  mod.getGoogleAuthInfo = function(optAuthLandingUrl) {
    var url = "/api/google/" + login.me() + "/auth/info";
    if (util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  mod.postGoogleAuthRevoke = function() {
    var url = "/api/google/" + login.me() + "/auth/revoke";
    return jsonHttpPost(url, "");
  };


  /***** Team label syncing *****/

  mod.getSyncedLabels = function(teamid) {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpGet(url);
  };

  mod.putSyncedLabels = function(teamid, labels) {
    var url = "/api/labels/synced/" + teamid;
    return jsonHttpPut(url, JSON.stringify(labels));
  };

  mod.getSharedLabels = function(teamid) {
    var url = "/api/labels/shared/" + teamid;
    return jsonHttpGet(url);
  };

  /***** Team calendar *****/

  mod.setTeamCalendar = function(teamid, calId) {
    var url = "/api/calendar/select/" + login.me() + "/" + teamid;
    var data = { calendar_id: calId };
    return jsonHttpPut(url, JSON.stringify(data));
  }

  /***** Google profile information *****/

  mod.getGoogleEmail = function(myUID, theirUID, teamid) {
    var url = "/api/google/email/" + myUID + "/" + theirUID + "/" + teamid;
    return jsonHttpGet(url);
  };

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + login.data.uid;
  }

  function apiQPrefix() {
    return "/api/q/" + login.data.uid;
  }

  function api_tasks_prefix() {
    return apiQPrefix() + "/tasks/" + login.getTeam().teamid;
  }

  function apiTaskProfilePrefix() {
    return apiQPrefix() + "/profile";
  }

  mod.getProfile = function(uid) {
    return jsonHttpGet(apiProfilePrefix() + "/" + uid);
  };


  /*** Scheduling ***/

  function apiSPrefix() {
    return "/api/s/" + login.data.uid;
  };

  mod.getCalendarList = function(uid2, optAuthLandingUrl) {
    var url = apiSPrefix() + "/calendar/"
      + login.getTeam().teamid + "/" + uid2 + "/list";
    if (util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  return mod;
})();
