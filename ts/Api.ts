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

  /********************************* API ***************************/


  /* Esper login and password management */

  export function getLoginInfo():
  JQueryPromise<ApiT.LoginResponse> {
    return JsonHttp.get("/api/login/" + string(Login.me())
                        + "/info");
  }

  export function loginAs(theirEmail):
  JQueryPromise<ApiT.LoginResponse> {
    return JsonHttp.get("/api/login-as/" + string(Login.me())
                        + "/" + string(theirEmail));
  }

  export function loginOnce(uid, loginNonce):
  JQueryPromise<ApiT.LoginResponse> {
    return JsonHttp.post("/api/login/" + string(uid)
                         + "/once/" + string(loginNonce),
                         "");
  }

  export function random():
  JQueryPromise<ApiT.Random> {
    return JsonHttp.post("/api/random", "");
  }

  /*** Esper team management ***/

  export function inviteCreateTeam():
  JQueryPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return JsonHttp.post("/api/invite/" + string(fromUid) + "/create-team",
                         JSON.stringify(invite));
  }

  export function inviteJoinTeam(invite):
  JQueryPromise<void> {
    return JsonHttp.post("/api/invite/" + string(Login.me()) + "/join-team",
                         JSON.stringify(invite))
      .then(function(_ignored) {});
  }

  export function refer(): JQueryPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var refer = { from_uid: fromUid };
    return JsonHttp.post("/api/invite/" + string(fromUid) + "/refer",
                         JSON.stringify(refer));
  }

  export function setTeamName(teamid, name):
  JQueryPromise<void> {
    var fromUid = Login.me();
    return JsonHttp.put("/api/team-name/" + string(fromUid)
                        + "/" + string(teamid)
                        + "/" + string(name),
                        "");
  }

  export function approveTeam(teamid: string): JQueryPromise<void> {
    return JsonHttp.put("/api/team-approve/" + string(Login.me()) + "/" +
                        string(teamid) + "/true", "");
  }

  export function setExecutive(teamid, memberUid): JQueryPromise<void> {
    return JsonHttp.put("/api/team/" + Login.me() + "/" + teamid
                        + "/executive/" + memberUid, "");
  }

  export function setPrimaryAssistant(teamid, uid):
  JQueryPromise<ApiT.Team> {
    return JsonHttp.put("/api/team-primary/" + string(Login.me())
                        + "/" + string(teamid)
                        + "/" + string(uid),
                        "");
  }

  // restricted to admins and executive themselves
  export function addAssistant(teamid, uid):
  JQueryPromise<ApiT.Team> {
    return JsonHttp.put("/api/team-assistant/" + string(Login.me())
                        + "/" + string(teamid)
                        + "/" + string(uid),
                        "");
  }

  export function removeAssistant(teamid, memberUid): JQueryPromise<void> {
    return JsonHttp.delete_("/api/team/" + string(Login.me())
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
  export function postToken(token): JQueryPromise<ApiT.TokenInfo> {
    return JsonHttp.post("/api/token/" + encodeURIComponent(string(token)),
                         "");
  }

  export function postTokenEmail(token: string, email: string, name: string):
  JQueryPromise<ApiT.TokenInfo> {
    var path =
      "/api/token-email/" + encodeURIComponent(string(token))
      + "/" + encodeURIComponent(string(email))
      + "/" + encodeURIComponent(string(name));
    return JsonHttp.post(path, "");
  }


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl,
                                   optLoginNonce,
                                   optInvite,
                                   optEmail):
  JQueryPromise<ApiT.UrlResult> {
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
    url = url + JsonHttp.makeQuery(q);
    return JsonHttp.get(url);
  }

  export function getGoogleAuthUrlForTeam(uid, teamid, optAuthLandingUrl):
  JQueryPromise<ApiT.UrlResult> {
    var url = "/api/google-auth-url/" + string(uid) + "/" + string(teamid);
    var q = [];
    if (Util.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    url = url + JsonHttp.makeQuery(q);
    return JsonHttp.get(url);
  }

  export function getGoogleAuthInfo(optAuthLandingUrl):
  JQueryPromise<ApiT.GoogleAuthInfo> {
    var url = "/api/google/" + string(Login.me()) + "/auth/info";
    if (Util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return JsonHttp.get(url);
  }

  export function postGoogleAuthRevoke():
  JQueryPromise<any> {
    var url = "/api/google/" + string(Login.me()) + "/auth/revoke";
    return JsonHttp.post(url, "");
  }


  /***** Nylas *****/
  export function getNylasLoginUrl(email:string):
  JQueryPromise<ApiT.UrlResult> {
    var url = "/api/inbox/login/" + encodeURIComponent(email);
    return JsonHttp.get(url);
  }

  export function setupNylasCalendar(teamid: string,
                                     execName: string,
                                     timezone: string):
  JQueryPromise<void> {
    var url = "/api/inbox/setup-calendar/" +
      string(Login.me()) + "/" +
      encodeURIComponent(teamid) + "/" +
      encodeURIComponent(execName) + "/" +
      encodeURIComponent(timezone);
    return JsonHttp.post(url);
  }


  /***** Team label syncing *****/

  export function getSyncedLabels(teamid):
  JQueryPromise<ApiT.EmailLabels> {
    var url = "/api/labels/synced/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putSyncedLabels(teamid, labels):
  JQueryPromise<void> {
    var url = "/api/labels/synced/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(labels));
  }

  export function getSharedLabels(teamid):
  JQueryPromise<ApiT.EmailLabels> {
    var url = "/api/labels/shared/" + string(teamid);
    return JsonHttp.get(url);
  }

  /***** Google profile information *****/

  export function getGoogleEmail(myUID, theirUID, teamid):
  JQueryPromise<ApiT.AccountEmail> {
    var url =
      "/api/google/email/" + string(myUID)
      + "/" + string(theirUID)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  /*******/

  function apiProfilePrefix() {
    return "/api/profile/" + string(Login.data.uid);
  }

  export function getProfile(uid, teamid): JQueryPromise<ApiT.Profile> {
    return JsonHttp.get(apiProfilePrefix()
                       + "/" + string(uid)
                       + "/" + string(teamid));
  }

  export function getAllProfiles(): JQueryPromise<ApiT.ProfileList> {
    return JsonHttp.get(apiProfilePrefix());
  }

  export function getMyProfile() {
    return JsonHttp.get(apiProfilePrefix() + "/me");
  }


  /*** Scheduling ***/

  export function getCalendarList(teamid?: string)
    : JQueryPromise<ApiT.Calendars> {
    var url = "api/calendar/list/" + string(Login.data.uid);
    if (teamid) {
      url += "/" + string(teamid);
    }
    return JsonHttp.get(url);
  }

  export function getCalendarShares(cal): JQueryPromise<ApiT.CalendarAcl> {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/list/" + string(Login.data.uid);
    return JsonHttp.post(url, JSON.stringify(calspec));
  }

  export function putCalendarShare(cal, email): JQueryPromise<void> {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/add/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(email));
    return JsonHttp.put(url, JSON.stringify(calspec));
  }

  export function deleteCalendarShare(cal, rule_id): JQueryPromise<void> {
    var calspec = {google_cal_id: cal.google_cal_id,
                   authorized_as: cal.authorized_as};
    var url = "api/calendar/share/remove/"
      + string(Login.data.uid) + "/"
      + encodeURIComponent(string(rule_id));
    return JsonHttp.post(url, JSON.stringify(calspec));
  }

  export function createTeamCalendar(forUid, teamid, tz, name):
  JQueryPromise<void> {
    var url = "api/calendar/share/create/"
      + string(Login.data.uid) + "/"
      + string(forUid) + "/"
      + encodeURIComponent(string(teamid)) + "/"
      + encodeURIComponent(string(tz)) + "/"
      + encodeURIComponent(string(name));
    return JsonHttp.post(url, "");
  }

  export function putTeamCalendars(teamid, cals):
  JQueryPromise<void> {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/calendars";
    return JsonHttp.put(url, JSON.stringify(cals));
  }

  export function putTeamEmails(teamid, aliases):
  JQueryPromise<ApiT.EmailAddresses> {
    var url = "api/team/" + string(Login.data.uid)
      + "/" + string(teamid) + "/emails";
    return JsonHttp.put(url, JSON.stringify(aliases));
  }

  export function putAccountEmails(teamid, theirUID, aliases):
  JQueryPromise<ApiT.EmailAddresses> {
    var url = "api/account/emails/" + string(Login.data.uid)
      + "/" + string(teamid) + "/" + string(theirUID);
    return JsonHttp.put(url, JSON.stringify(aliases));
  }

  export function postForCalendarEventsCSV(teamid: string,
                                           calid: string,
                                           q: ApiT.CalendarRequest):
  JQueryPromise<string> {
    var url = "/api/calendar/events/csv/" + string(Login.data.uid)
      + "/" + string(teamid) + "/" + string(calid);
    return JsonHttp.post(url, JSON.stringify(q), "text");
  }

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export function setPreferences(teamid, preferences):
  JQueryPromise<void> {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(preferences));
  }

  /** Adds workplaces given the correct JSON object. */
  export function addWorkplaces(teamid, workplaces):
  JQueryPromise<void> {
    var url = "/api/preferences/workplace/add/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Removes workplaces given the correct JSON object. */
  export function removeWorkplaces(teamid, workplaces):
  JQueryPromise<void> {
    var url = "/api/preferences/workplace/remove/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Sets workplaces given the correct JSON object. */
  export function setWorkplaces(teamid, workplaces):
  JQueryPromise<void> {
    var url = "/api/preferences/workplace/change/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Sets transportation given the correct JSON object. */
  export function setTransportation(teamid, transportation):
  JQueryPromise<void> {
    var url = "/api/preferences/transportation/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(transportation));
  }

  /** Sets meeting types given the correct JSON object. */
  export function setMeetingTypes(teamid, meeting_types):
  JQueryPromise<void> {
    var url = "/api/preferences/meetings/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(meeting_types));
  }

  /** Sets email types given the correct JSON object. */
  export function setEmailTypes(teamid, email_types):
  JQueryPromise<void> {
    var url = "/api/preferences/emails/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(email_types));
  }

  /** Sets general prefs given the correct JSON object. */
  export function setGeneralPrefs(teamid, general_prefs):
  JQueryPromise<void> {
    var url = "/api/preferences/general/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(general_prefs));
  }

  /** Sets coworkers given the correct JSON object. */
  export function setCoworkers(teamid, coworkers):
  JQueryPromise<void> {
    var url = "/api/preferences/coworkers/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, string(coworkers));
  }

  /** Sets notes given the correct JSON object. */
  export function setNotes(teamid, notes):
  JQueryPromise<void> {
    var url = "/api/preferences/notes/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, string(notes));
  }

  /** The preferences currently saved for the given team executive, as
   *  a JSON object.
   */
  export function getPreferences(teamid):
  JQueryPromise<ApiT.Preferences> {
    var url = "/api/preferences/" + string(Login.me()) + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  /*** Payments ***/

  export function getSubscriptionStatus(teamid):
  JQueryPromise<ApiT.CustomerStatus> {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getSubscriptionStatusLong(teamid):
  JQueryPromise<ApiT.CustomerDetails> {
    var url = "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);

      return JsonHttp.get(url);
  }

  export function setSubscription(teamid, planid):
  JQueryPromise<void> {
    var url = "/api/pay/subscribe/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(planid);
    return JsonHttp.post(url, "");
  }

  export function cancelSubscription(teamid):
  JQueryPromise<void> {
    var url = "/api/pay/unsubscribe/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.post(url, "");
  }

  export function addNewCard(teamid, cardToken):
  JQueryPromise<ApiT.PaymentCard> {
    var url = "/api/pay/new-card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(cardToken));
    return JsonHttp.post(url, "");
  }

  export function deleteCard(teamid, cardid):
  JQueryPromise<void> {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return JsonHttp.delete_(url);
  }

  export function setDefaultCard(teamid, cardid):
  JQueryPromise<void> {
    var url = "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return JsonHttp.put(url,"");
  }

  /*** Usage tracking ***/

  export function getPeriodList(teamid: string):
  JQueryPromise<ApiT.TaskUsageList> {
    var url = "/api/usage/period-list/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getUsageEdit(teamid: string,
                               periodStart: number):
  JQueryPromise<ApiT.TaskUsage> {
    var url = "/api/usage/edit/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart);
    return JsonHttp.get(url);
  }

  export function putUsageEdit(tu: ApiT.TaskUsage):
  JQueryPromise<ApiT.TaskUsage> {
    var periodStart = Unixtime.ofRFC3339(tu.start);
    var url = "/api/usage/edit/" + string(Login.me())
      + "/" + string(tu.teamid)
      + "/" + number(periodStart);
    return JsonHttp.put(url, JSON.stringify(tu));
  }

  export function getUsageExtraCharge(teamid: string,
                                      periodStart: number,
                                      revision: number):
  JQueryPromise<ApiT.ExtraCharge> {
    var url = "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return JsonHttp.get(url);
  }

  export function postUsageExtraCharge(teamid: string,
                                       periodStart: number,
                                       revision: number):
  JQueryPromise<void> {
    var url = "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return JsonHttp.post(url, "");
  }

  /***/

  export function getSignature(teamid, theirUid):
  JQueryPromise<ApiT.EmailSignature> {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return JsonHttp.get(url);
  }

  export function setSignature(teamid, theirUid, sig : ApiT.EmailSignature):
  JQueryPromise<void> {
    var url = "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return JsonHttp.put(url, JSON.stringify(sig));
  }

  export function getEventColors():
  JQueryPromise<ApiT.CalendarEventPalette> {
    var url = "/api/gcal/colors/event/" + string(Login.me());
    return JsonHttp.get(url);
  }

  export function signup(email, data : ApiT.Signup):
  JQueryPromise<void> {
    var url = "/api/signup/" + string(email);
    return JsonHttp.put(url, JSON.stringify(data));
  }

  export function listWorkflows(teamid):
  JQueryPromise<ApiT.UserWorkflows> {
    var url = "/api/workflows/list/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function createWorkflow(teamid, title):
  JQueryPromise<ApiT.Workflow> {
    var url = "/api/workflows/create/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(title);
    return JsonHttp.post(url, "");
  }

  export function updateWorkflow(teamid, workflowid, workflow : ApiT.Workflow):
  JQueryPromise<void> {
    var url = "/api/workflows/update/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return JsonHttp.put(url, JSON.stringify(workflow));
  }

  export function deleteWorkflow(teamid, workflowid):
  JQueryPromise<void> {
    var url = "/api/workflows/delete/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return JsonHttp.delete_(url);
  }

  export function listTemplates(teamid):
  JQueryPromise<ApiT.UserTemplate> {
    var url = "/api/template-list/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function createTemplate(teamid, title):
  JQueryPromise<ApiT.Template> {
    var url = "/api/template-create/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(title);
    return JsonHttp.post(url, "");
  }

  export function updateTemplate(teamid, templateid, template: ApiT.Template):
  JQueryPromise<void> {
    var url = "/api/template/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(templateid);
    return JsonHttp.put(url, JSON.stringify(template));
  }

  export function deleteTemplate(teamid, templateid):
  JQueryPromise<void> {
    var url = "/api/template/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(templateid);
    return JsonHttp.delete_(url);
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
    return JsonHttp.post(url, JSON.stringify(feedback));
  }

}
