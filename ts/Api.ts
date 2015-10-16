/*
  API client
*/

module Esper.Api {

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.
  */
  function string(x: string) {
    console.assert(x !== undefined && x !== null);
    return x;
  }

  function number(x: number): string {
    console.assert(x !== undefined && x !== null);
    return x.toString();
  }

  // HTTP - response body is interpreted as JSON

  var suppressWarnings = false; //  Toggled with noWarn()

  function jsonHttp(method, dataType, url, body) {

    var id = Util.randomString();

    function logResponse(method: string, path: string, respBody, latency) {
      Log.d("API response " + id
            + " " + method
            + " " + path
            + " [" + latency + "s]",
            respBody);
    }

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
        Log.d("Bad request", details);
        break;
      case 401:
        Log.d("Unauthorized", details);
        break;
      case 403:
        Log.d("Forbidden", details);
        break;
      case 404:
        Log.d("Not found", details);
        break;
      case 500: /* Server error */
        Log.d("Server error", details);
        break;
      default: /* Fallback */
        Log.d("Unknown error " + xhr.status, details);
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
      dataType: dataType,
      beforeSend: Login.setHttpHeaders(url)
    };
    if (body && body.length > 0) {
      request["contentType"] = "application/json; charset=UTF-8";
    }

    Log.d("API request " + id + " " + method + " " + url, request);

    var startTime = Date.now();
    var ret = $
      .ajax(request)
      .done(function(respBody) {
              var latency = (Date.now() - startTime) / 1000;
              logResponse(method, url, respBody, latency);
            });
    if (! suppressWarnings) {
      ret = ret.fail(logError);
    }
    return ret;
  }

  function jsonHttpGet(url) {
    return jsonHttp("GET", "json", url, null);
  }

  function jsonHttpPost(url, body:any = "") {
    return jsonHttp("POST", "json", url, body);
  }

  function jsonHttpPut(url, body) {
    return jsonHttp("PUT", "json", url, body);
  }

  function jsonHttpDelete(url) {
    return jsonHttp("DELETE", "json", url, null);
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

  // Calls a function, but API calls within that call don't have the error 
  // banner popping up -- use for custom error handling.
  export function noWarn(callable) {
    suppressWarnings = true;
    let ret = callable();
    suppressWarnings = false;
    return ret;
  };

  /********************************* API ***************************/


  /* Esper login and password management */

  export function getLoginInfo()
    : JQueryPromise<ApiT.LoginResponse>
  {
    return jsonHttpGet("/api/login/" + string(Login.me())
                       + "/info");
  }

  export function loginAs(theirEmail)
    : JQueryPromise<ApiT.LoginResponse>
  {
    return jsonHttpGet("/api/login-as/" + string(Login.me())
                       + "/" + string(theirEmail));
  }

  export function loginOnce(uid, loginNonce)
    : JQueryPromise<ApiT.LoginResponse>
  {
    return jsonHttpPost("/api/login/" + string(uid)
                        + "/once/" + string(loginNonce),
                        "");
  }

  export function random()
    : JQueryPromise<ApiT.Random>
  {
    return jsonHttpPost("/api/random", "");
  }

  /*** Esper team management ***/

  export function inviteCreateTeam()
    : JQueryPromise<ApiT.UrlResult>
  {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return jsonHttpPost("/api/invite/" + string(fromUid) + "/create-team",
                        JSON.stringify(invite));
  }

  export function inviteJoinTeam(invite)
    : JQueryPromise<void>
  {
    return jsonHttpPost("/api/invite/" + string(Login.me()) + "/join-team",
                        JSON.stringify(invite))
      .then(function(_ignored) {});
  }

  export function refer(): JQueryPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var refer = { from_uid: fromUid };
    return jsonHttpPost("/api/invite/" + string(fromUid) + "/refer",
                        JSON.stringify(refer));
  }

  export function setTeamName(teamid, name):
  JQueryPromise<void> {
    var fromUid = Login.me();
    return jsonHttpPut("/api/team-name/" + string(fromUid)
                       + "/" + string(teamid)
                       + "/" + string(name),
                       "");
  }

  export function approveTeam(teamid: string): JQueryPromise<void> {
    return jsonHttpPut("/api/team-approve/" + string(Login.me()) + "/" +
      string(teamid) + "/true", "");
  }

  export function setExecutive(teamid, memberUid)
    : JQueryPromise<void>
  {
    return jsonHttpPut("/api/team/" + Login.me() + "/" + teamid
                       + "/executive/" + memberUid, "");
  }

  export function removeAssistant(teamid, memberUid)
    : JQueryPromise<void>
  {
    return jsonHttpDelete("/api/team/" + string(Login.me())
                          + "/" + string(teamid)
                          + "/member/" + string(memberUid));
  }

  /***** Opaque URLs with unique token *****/

  /*
    Post an opaque token provided in a URL of the form:

      https://app.esper.com/#!t/XXXXXX

    The response describes what has be done and what can be done next.
    This is used for invites and other URLs that are given out to users.
   */
  export function postToken(token)
  : JQueryPromise<ApiT.TokenInfo>
  {
    return jsonHttpPost("/api/token/" + encodeURIComponent(string(token)), "");
  }

  export function postTokenEmail(token: string, email: string, name: string)
  : JQueryPromise<ApiT.TokenInfo>
  {
    var path =
      "/api/token-email/" + encodeURIComponent(string(token))
      + "/" + encodeURIComponent(string(email))
      + "/" + encodeURIComponent(string(name));
    return jsonHttpPost(path, "");
  }


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl,
                                  optLoginNonce,
                                  optInvite,
                                  optEmail)
    : JQueryPromise<ApiT.UrlResult>
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
  }

  export function getGoogleAuthUrlForTeam(uid, teamid, optAuthLandingUrl)
    : JQueryPromise<ApiT.UrlResult>
  {
    var url = "/api/google-auth-url/" + string(uid) + "/" + string(teamid);
    var q = [];
    if (Util.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    url = url + makeQuery(q);
    return jsonHttpGet(url);
  }

  export function getGoogleAuthInfo(optAuthLandingUrl)
    : JQueryPromise<ApiT.GoogleAuthInfo>
  {
    var url = "/api/google/" + string(Login.me()) + "/auth/info";
    if (Util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  }

  export function postGoogleAuthRevoke()
    : JQueryPromise<any> // FIXME
  {
    var url = "/api/google/" + string(Login.me()) + "/auth/revoke";
    return jsonHttpPost(url, "");
  }


  /***** Nylas *****/
  export function getNylasLoginUrl(email:string)
    : JQueryPromise<ApiT.UrlResult>
  {
    var url = "/api/inbox/login/" + encodeURIComponent(email);
    return jsonHttpGet(url);
  }

  export function setupNylasCalendar(teamid: string,
                                     execName: string,
                                     timezone: string)
    : JQueryPromise<void>
  {
    var url = "/api/inbox/setup-calendar/" +
      string(Login.me()) + "/" +
      encodeURIComponent(teamid) + "/" +
      encodeURIComponent(execName) + "/" +
      encodeURIComponent(timezone);
    return jsonHttpPost(url);
  }


  /***** Team label syncing *****/

  export function getSyncedLabels(teamid)
    : JQueryPromise<ApiT.EmailLabels>
  {
    var url = "/api/labels/synced/" + string(teamid);
    return jsonHttpGet(url);
  }

  export function putSyncedLabels(teamid, labels)
    : JQueryPromise<void>
  {
    var url = "/api/labels/synced/" + string(teamid);
    return jsonHttpPut(url, JSON.stringify(labels));
  }

  export function getSharedLabels(teamid)
    : JQueryPromise<ApiT.EmailLabels>
  {
    var url = "/api/labels/shared/" + string(teamid);
    return jsonHttpGet(url);
  }

  /***** Google profile information *****/

  export function getGoogleEmail(myUID, theirUID, teamid)
    : JQueryPromise<ApiT.AccountEmail>
  {
    var url =
      "/api/google/email/" + string(myUID)
      + "/" + string(theirUID)
      + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + string(Login.data.uid);
  }

  export function getProfile(uid, teamid)
    : JQueryPromise<ApiT.Profile>
  {
    return jsonHttpGet(apiProfilePrefix()
                       + "/" + string(uid)
                       + "/" + string(teamid));
  }

  export function getAllProfiles()
    : JQueryPromise<ApiT.ProfileList>
  {
    return jsonHttpGet(apiProfilePrefix());
  }

  export function getMyProfile() {
    return jsonHttpGet(apiProfilePrefix() + "/me");
  }


  /*** Scheduling ***/

  export function getCalendarList(teamid)
    : JQueryPromise<ApiT.Calendars>
  {
    var url = "api/calendar/list/" + string(Login.data.uid)
                             + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  export function getCalendarShares(cal)
    : JQueryPromise<ApiT.CalendarAcl>
  {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/list/" + string(Login.data.uid);
    return jsonHttpPost(url, JSON.stringify(calspec));
  }

  export function putCalendarShare(cal, email)
    : JQueryPromise<void>
  {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/add/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(email));
    return jsonHttpPut(url, JSON.stringify(calspec));
  }

  export function deleteCalendarShare(cal, rule_id)
    : JQueryPromise<void>
  {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/remove/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(rule_id));
    return jsonHttpPost(url, JSON.stringify(calspec));
  }

  export function createTeamCalendar(forUid, teamid, tz, name)
    : JQueryPromise<void>
  {
    var url = "api/calendar/share/create/"
      + string(Login.data.uid) + "/"
      + string(forUid) + "/"
      + encodeURIComponent(string(teamid)) + "/"
      + encodeURIComponent(string(tz)) + "/"
      + encodeURIComponent(string(name));
    return jsonHttpPost(url, "");
  }

  export function putTeamCalendars(teamid, cals)
    : JQueryPromise<void>
  {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/calendars";
    return jsonHttpPut(url, JSON.stringify(cals));
  }

  export function putTeamEmails(teamid, aliases)
    : JQueryPromise<ApiT.EmailAddresses>
  {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/emails";
    return jsonHttpPut(url, JSON.stringify(aliases));
  }

  export function putAccountEmails(teamid, theirUID, aliases)
    : JQueryPromise<ApiT.EmailAddresses>
  {
    var url = "api/account/emails/" + string(Login.data.uid)
      + "/" + string(teamid) + "/" + string(theirUID);
    return jsonHttpPut(url, JSON.stringify(aliases));
  }

  export function postForCalendarEventsCSV(teamid: string,
                                           calid: string,
                                           q: ApiT.CalendarRequest)
: JQueryPromise<string>
  {
    var url = "api/calendar/events/csv/" + string(Login.data.uid)
            + "/" + string(teamid) + "/" + string(calid);
    return jsonHttp("POST", "text", url, JSON.stringify(q));
  }

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export function setPreferences(teamid, preferences)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return jsonHttpPut(url, JSON.stringify(preferences));
  }

  /** Adds workplaces given the correct JSON object. */
  export function addWorkplaces(teamid, workplaces)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/workplace/add/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(workplaces));
  }

  /** Removes workplaces given the correct JSON object. */
  export function removeWorkplaces(teamid, workplaces)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/workplace/remove/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(workplaces));
  }

  /** Sets workplaces given the correct JSON object. */
  export function setWorkplaces(teamid, workplaces)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/workplace/change/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(workplaces));
  }

  /** Sets transportation given the correct JSON object. */
  export function setTransportation(teamid, transportation)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/transportation/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(transportation));
  }

  /** Sets meeting types given the correct JSON object. */
  export function setMeetingTypes(teamid, meeting_types)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/meetings/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(meeting_types));
  }

  /** Sets email types given the correct JSON object. */
  export function setEmailTypes(teamid, email_types)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/emails/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(email_types));
  }

  /** Sets general prefs given the correct JSON object. */
  export function setGeneralPrefs(teamid, general_prefs)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/general/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, JSON.stringify(general_prefs));
  }

  /** Sets coworkers given the correct JSON object. */
  export function setCoworkers(teamid, coworkers)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/coworkers/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, string(coworkers));
  }

  /** Sets notes given the correct JSON object. */
  export function setNotes(teamid, notes)
    : JQueryPromise<void>
  {
    var url = "/api/preferences/notes/" + string(Login.me()) + "/" +
      string(teamid);
    return jsonHttpPut(url, string(notes));
  }

  /** The preferences currently saved for the given team executive, as
   *  a JSON object.
   */
  export function getPreferences(teamid)
    : JQueryPromise<ApiT.Preferences>
  {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  /*** Payments ***/

  export function getSubscriptionStatus(teamid)
    : JQueryPromise<ApiT.CustomerStatus>
  {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  export function getSubscriptionStatusLong(teamid)
    : JQueryPromise<ApiT.CustomerDetails>
  {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);

      return jsonHttpGet(url);
  }

  export function setSubscription(teamid, planid)
  : JQueryPromise<void>
  {
    var url = "/api/pay/subscribe/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(planid);
    return jsonHttpPost(url, "");
  }

  export function cancelSubscription(teamid)
  : JQueryPromise<void>
  {
    var url = "/api/pay/unsubscribe/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpPost(url, "");
  }

  export function addNewCard(teamid, cardToken)
  : JQueryPromise<ApiT.PaymentCard>
  {
    var url = "/api/pay/new-card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(cardToken));
    return jsonHttpPost(url, "");
  }

  export function deleteCard(teamid, cardid)
  : JQueryPromise<void>
  {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return jsonHttpDelete(url);
  }

  export function setDefaultCard(teamid, cardid)
  : JQueryPromise<void>
  {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return jsonHttpPut(url,"");
  }

  /*** Usage tracking ***/

  export function getPeriodList(teamid: string):
  JQueryPromise<ApiT.TaskUsageList> {
    var url = "/api/usage/period-list/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  export function getUsageEdit(teamid: string,
                               periodStart: number):
  JQueryPromise<ApiT.TaskUsage> {
    var url = "/api/usage/edit/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart);
    return jsonHttpGet(url);
  }

  export function putUsageEdit(tu: ApiT.TaskUsage):
  JQueryPromise<ApiT.TaskUsage> {
    var periodStart = Unixtime.ofRFC3339(tu.start);
    var url = "/api/usage/edit/" + string(Login.me())
      + "/" + string(tu.teamid)
      + "/" + number(periodStart);
    return jsonHttpPut(url, JSON.stringify(tu));
  }

  export function getUsageExtraCharge(teamid: string,
                                      periodStart: number,
                                      revision: number):
  JQueryPromise<ApiT.ExtraCharge> {
    var url = "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return jsonHttpGet(url);
  }

  export function postUsageExtraCharge(teamid: string,
                                       periodStart: number,
                                       revision: number):
  JQueryPromise<void> {
    var url = "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return jsonHttpPost(url, "");
  }

  /***/

  export function getSignature(teamid, theirUid)
    : JQueryPromise<ApiT.EmailSignature>
  {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return jsonHttpGet(url);
  }

  export function setSignature(teamid, theirUid, sig : ApiT.EmailSignature)
    : JQueryPromise<void>
  {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return jsonHttpPut(url, JSON.stringify(sig));
  }

  export function getEventColors()
    : JQueryPromise<ApiT.CalendarEventPalette>
  {
    var url = "/api/gcal/colors/event/" + string(Login.me());
    return jsonHttpGet(url);
  }

  export function signup(email, data : ApiT.Signup)
    : JQueryPromise<void>
  {
    var url = "/api/signup/" + string(email);
    return jsonHttpPut(url, JSON.stringify(data));
  }

  export function listWorkflows(teamid)
    : JQueryPromise<ApiT.UserWorkflows>
  {
    var url = "/api/workflows/list/" + string(Login.me())
      + "/" + string(teamid);
    return jsonHttpGet(url);
  }

  export function createWorkflow(teamid, title)
    : JQueryPromise<ApiT.Workflow>
  {
    var url = "/api/workflows/create/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(title);
    return jsonHttpPost(url, "");
  }

  export function updateWorkflow(teamid, workflowid, workflow : ApiT.Workflow)
    : JQueryPromise<void>
  {
    var url = "/api/workflows/update/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return jsonHttpPut(url, JSON.stringify(workflow));
  }

  export function deleteWorkflow(teamid, workflowid)
    : JQueryPromise<void>
  {
    var url = "/api/workflows/delete/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return jsonHttpDelete(url);
  }

  export function listTemplates(teamid)
      : JQueryPromise<ApiT.UserTemplate> {
      var url = "/api/template-list/" + string(Login.me())
          + "/" + string(teamid);
      return jsonHttpGet(url);
  }

  export function createTemplate(teamid, title)
      : JQueryPromise<ApiT.Template> {
      var url = "/api/template-create/" + string(Login.me())
          + "/" + string(teamid)
          + "/" + string(title);
      return jsonHttpPost(url, "");
  }

  export function updateTemplate(teamid, templateid, template: ApiT.Template)
      : JQueryPromise<void> {
      var url = "/api/template/" + string(Login.me())
          + "/" + string(teamid)
          + "/" + string(templateid);
      return jsonHttpPut(url, JSON.stringify(template));
  }

  export function deleteTemplate(teamid, templateid)
      : JQueryPromise<void> {
      var url = "/api/template/" + string(Login.me())
          + "/" + string(teamid)
          + "/" + string(templateid);
      return jsonHttpDelete(url);
  }

  /* Support */

  export function sendSupportEmail(msg: string): JQueryPromise<void> {
    var url = "/api/support/email";
    var feedback: {body: string, user?: string} = { body: msg };
    var uid = Login.me();
    if (uid) {
      url += ("/" + uid);
      feedback.user = uid;
    }
    return jsonHttpPost(url, JSON.stringify(feedback));
  }

}
