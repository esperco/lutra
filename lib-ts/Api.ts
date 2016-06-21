/*
  Communicate with API server (Wolverine). A little bulky to put everything
  in one module but less of a headache than keeping everything separate
*/

/// <reference path="./JsonHttp.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Log.ts" />
/// <reference path="./Unixtime.ts" />

module Esper.Api {

  // Can change prefix in init code depending on where API server is
  export var prefix = "";

  // Initialize defaults depending on whether we're in production mode
  if (Esper.PRODUCTION) {
    prefix = "https://app.esper.com";
  } else {
    // No port (assume API server is on Port 80)
    prefix = window.location.protocol + "//" + window.location.hostname;
  }

  export function echo(serializable: any) {
    return JsonHttp.post(prefix + "/echo",
                         JSON.stringify(serializable));
  }

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.
  */
  function string(x: string) {
    Log.assert(x !== undefined && x !== null);
    return x;
  }

  function number(x: number): string {
    console.assert(x !== undefined && x !== null);
    return x.toString();
  }


  /* Esper login and password management */

  export function getLoginInfo():
  JQueryPromise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + string(Login.myUid()) + "/info";
    return JsonHttp.get(url);
  }

  export function loginAs(theirEmail: string):
    JQueryPromise<ApiT.LoginResponse> {
    return JsonHttp.get(prefix + "/api/login-as/" + string(Login.me())
      + "/" + string(theirEmail));
  }

  export function loginOnce(uid: string, loginNonce: string):
    JQueryPromise<ApiT.LoginResponse> {
    return JsonHttp.post(prefix + "/api/login/" + string(uid)
      + "/once/" + string(loginNonce),
      "");
  }

  export function deactivate(uid?: string): JQueryPromise<void> {
    uid = uid || Login.myUid();
    return JsonHttp.post(
      prefix + `/api/deactivate/${Login.myUid()}/${uid}`,
      "");
  }

  export function random():
    JQueryPromise<ApiT.Random> {
    return JsonHttp.post(prefix + "/api/random", "");
  }

  /*** Esper team management ***/

  export function getTeamForExec(email: string):
    JQueryPromise<ApiT.TeamOption> {
    return JsonHttp.get(prefix + "/api/team/" + string(Login.myUid())
      + "/email/" + string(email));
  }

  export function getTeam(teamId: string): JQueryPromise<ApiT.Team> {
    return JsonHttp.get(prefix + "/api/team/" + string(Login.myUid())
      + "/" + string(teamId));
  }

  export function deactivateTeam(teamId: string): JQueryPromise<void> {
    return JsonHttp.post(prefix + "/api/deactivate-team/" +
      string(Login.myUid()) + "/" + string(teamId));
  }

  export function inviteCreateTeam():
    JQueryPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return JsonHttp.post(prefix + "/api/invite/" + string(fromUid) +
      "/create-team", JSON.stringify(invite));
  }

  export function inviteJoinTeam(invite: ApiT.InviteJoinTeam):
    JQueryPromise<void> {
    return JsonHttp.post(prefix + "/api/invite/" + string(Login.me()) +
      "/join-team", JSON.stringify(invite));
  }

  export function setTeamName(teamid: string, name: string):
    JQueryPromise<void> {
    var fromUid = Login.me();
    return JsonHttp.put(prefix + "/api/team-name/" + string(fromUid)
      + "/" + string(teamid)
      + "/" + string(name),
      "");
  }

  export function approveTeam(teamid: string): JQueryPromise<void> {
    return JsonHttp.put(prefix + "/api/team-approve/" + string(Login.me()) +
      "/" + string(teamid) + "/true", "");
  }

  export function setTeamOwner(teamid: string, uid: string):
    JQueryPromise<void> {
    return JsonHttp.put(prefix + "/api/team-owner/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  export function setTeamCalUser(teamid: string, uid: string):
    JQueryPromise<void> {
    return JsonHttp.put(prefix + "/api/team-cal-user/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  // restricted to admins and executive themselves
  export function addAssistant(teamid: string, uid: string):
    JQueryPromise<ApiT.Team> {
    return JsonHttp.put(prefix + "/api/team-assistant/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  export function removeAssistant(teamid: string, memberUid: string):
    JQueryPromise<void>
  {
    return JsonHttp.delete_(prefix + "/api/team/" + string(Login.me())
      + "/" + string(teamid)
      + "/member/" + string(memberUid));
  }

  /***** Esper group management *****/

  export function getGroups(teamid: string):
    JQueryPromise<ApiT.GroupList>
  {
    var url = prefix + "/api/group/team/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getGroupsByUid(uid: string):
    JQueryPromise<ApiT.GroupList>
  {
    var url = prefix + "/api/group/user/" + string(Login.me())
      + "/" + string(uid);
    return JsonHttp.get(url);
  }

  export function getGroupDetails(groupid: string):
    JQueryPromise<ApiT.Group>
  {
    var url = prefix + "/api/group/details/" + string(Login.me())
      + "/" + string(groupid);
    return JsonHttp.get(url);
  }

  export function createGroup(uid: string, groupName: string):
    JQueryPromise<ApiT.Group>
  {
    var url = prefix + "/api/group/create/" + string(Login.me())
      + "/" + string(uid)
      + "/" + string(groupName);
    return JsonHttp.post(url);
  }

  export function deleteGroup(groupid: string):
    JQueryPromise<void>
  {
    var url = prefix + "/api/group/delete/" + string(Login.me())
      + "/" + string(groupid);
    return JsonHttp.delete_(url);
  }

  export function putGroupMember(groupid: string, teamid: string):
    JQueryPromise<void>
  {
    var url = prefix + "/api/group/member/" + string(Login.me())
      + "/" + string(groupid)
      + "/" + string(teamid);
    return JsonHttp.put(url);
  }

  export function removeGroupMember(groupid: string, teamid: string):
    JQueryPromise<void>
  {
    var url = prefix + "/api/group/member" + string(Login.me())
      + "/" + string(groupid)
      + "/" + string(teamid);
    return JsonHttp.delete_(url);
  }

  export function putGroupIndividual(groupid: string, uid: string):
    JQueryPromise<ApiT.GroupIndividual>
  {
    var url = prefix + "/api/group/individual-member/" + string(Login.me())
      + "/" + string(groupid)
      + "/" + string(uid);
    return JsonHttp.put(url);
  }

  export function removeGroupIndividual(groupid: string, uid: string):
    JQueryPromise<void>
  {
    var url = prefix + "/api/group/individual-member/" + string(Login.me())
      + "/" + string(groupid)
      + "/" + string(uid);
    return JsonHttp.delete_(url);
  }

  export function putGroupLabels(groupid: string, labels: ApiT.GroupLabels):
    JQueryPromise<void>
  {
    var url = prefix + "/api/group/event-labels/" + string(Login.me())
      + "/" + string(groupid);
    return JsonHttp.put(url, JSON.stringify(labels));
  }

  /***** Opaque URLs with unique token *****/

  export function getToken(token: string): JQueryPromise<ApiT.TokenInfo> {
    return JsonHttp.get(prefix + "/api/token/" +
      encodeURIComponent(string(token)));
  }

  export function postToken(token: string): JQueryPromise<ApiT.TokenResponse> {
    return JsonHttp.noWarn(function() {
      return JsonHttp.post(prefix + "/api/token/"
                           + encodeURIComponent(string(token)), "");
    });
  }

  export function postTokenEmail(token: string, email: string, name: string):
    JQueryPromise<ApiT.TokenResponse> {
    var path = prefix +
      "/api/token-email/" + encodeURIComponent(string(token))
      + "/" + encodeURIComponent(string(email))
      + "/" + encodeURIComponent(string(name));
    return JsonHttp.post(path, "");
  }


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl: string,
    optLoginNonce: string,
    optInvite: string,
    optEmail: string,
    optGmail?: boolean): JQueryPromise<ApiT.UrlResult>
  {
    var url = prefix + "/api/google-auth-url";
    var q: string[] = [];
    if (_.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    if (_.isString(optLoginNonce))
      q.push("login_nonce=" + encodeURIComponent(optLoginNonce));
    if (_.isString(optInvite))
      q.push("invite=" + encodeURIComponent(optInvite));
    if (_.isString(optEmail))
      q.push("login_hint=" + encodeURIComponent(optEmail));
    if (optGmail) {
      q.push("gmail=true")
    }
    url = url + JsonHttp.makeQuery(q);
    return JsonHttp.get(url);
  }

  export function getGoogleAuthUrlForTeam(uid: string, teamid: string,
    optAuthLandingUrl: string): JQueryPromise<ApiT.UrlResult>
  {
    var url = prefix + "/api/google-auth-url/" + string(uid) + "/" +
      string(teamid);
    var q: string[] = [];
    if (_.isString(optAuthLandingUrl))
      q.push("auth_landing=" + encodeURIComponent(optAuthLandingUrl));
    url = url + JsonHttp.makeQuery(q);
    return JsonHttp.get(url);
  }

  export function getGoogleAuthInfo(optAuthLandingUrl: string):
    JQueryPromise<ApiT.GoogleAuthInfo>
  {
    var url = prefix + "/api/google/" + string(Login.me()) + "/auth/info";
    if (_.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return JsonHttp.get(url);
  }

  export function postGoogleAuthRevoke():
    JQueryPromise<any>
  {
    var url = prefix + "/api/google/" + string(Login.me()) + "/auth/revoke";
    return JsonHttp.post(url, "");
  }

  /***** Nylas *****/
  export function getNylasLoginUrl(email: string,
                                   nonce: string,
                                   landing_url: string,
                                   invite?: string):
    JQueryPromise<ApiT.UrlResult> {
      var inviteParam = invite ? "&invite=" + invite : "";
      var url = prefix + "/api/nylas/login/" + encodeURIComponent(email) +
        "?nonce=" + encodeURIComponent(nonce) +
        "&landing_url=" + encodeURIComponent(landing_url) +
        inviteParam;
    return JsonHttp.get(url);
  }

  /***** Slack *****/
  export function getSlackAuthInfo(teamid: string):
  JQueryPromise<ApiT.SlackAuthInfo> {
    var url = prefix + "/api/slack/auth-info/" + string(Login.me())
            + "/" + encodeURIComponent(string(teamid));
    return JsonHttp.get(url);
  }

  /***** Team label syncing *****/

  export function getSyncedLabels(teamid: string):
    JQueryPromise<ApiT.Labels> {
    var url = prefix + "/api/team/labels/" + string(Login.me()) +
      "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putSyncedLabels(teamid: string, labels: {labels: string[]}):
    JQueryPromise<void> {
    var url = prefix + "/api/team/labels/" + string(Login.me()) +
      "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(labels));
  }

  /***** Google profile information *****/

  export function getGoogleEmail(myUID: string, theirUID: string,
    teamid: string): JQueryPromise<ApiT.AccountEmail>
  {
    var url = prefix +
      "/api/google/email/" + string(myUID)
      + "/" + string(theirUID)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getProfile(uid: string, teamid: string):
    JQueryPromise<ApiT.Profile> {
    var url =
      prefix + "/api/profile/" + string(Login.myUid())
      + "/" + string(uid)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getAllTeamProfiles():
  JQueryPromise<ApiT.ProfileList> {
    var url =
      prefix + "/api/profile/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  // Alias used in Otter
  export var getAllProfiles = getAllTeamProfiles;

  export function getMyProfile() {
    var url = prefix + "/api/profile/" + string(Login.myUid()) + "/me";
    return JsonHttp.get(url);
  }

  export function putTeamEmails(teamid: string, aliases: ApiT.EmailAddresses):
    JQueryPromise<ApiT.EmailAddresses> {
    var url = prefix + "api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/emails";
    return JsonHttp.put(url, JSON.stringify(aliases));
  }

  // supports generic calendar
  export function getGenericCalendarList(teamid: string):
    JQueryPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/calendars/" + string(Login.myUid())
            + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getGenericCalendarListOfUser():
    JQueryPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/calendars/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  export function getTimestatsCalendarList(teamid: string):
    JQueryPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/ts-calendars/" + string(Login.myUid())
            + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  // supports generic calendar
  export function postForGenericCalendarEvents(teamid: string, calid: string,
    q: ApiT.CalendarRequest):
    JQueryPromise<ApiT.GenericCalendarEvents> {
    var url = prefix + "/api/ts/events/" + string(Login.myUid())
            + "/" + string(teamid)
            + "/" + encodeURIComponent(string(calid));
    return JsonHttp.post(url, JSON.stringify(q));
  }

  export function postForTeamEvents(teamId: string, q: ApiT.CalendarRequest):
    JQueryPromise<ApiT.GenericCalendarEventsCollection>
  {
    var url = prefix + "/api/ts/events-team/" + string(Login.myUid())
            + "/" + string(teamId);
    return JsonHttp.post(url, JSON.stringify(q));
  }

  export function getGenericEvent(teamid:string, calid:string, eventid:string):
  JQueryPromise<ApiT.GenericCalendarEvent> {
    var url = prefix + "/api/ts/events/" + string(Login.myUid())
            + "/" + string(teamid)
            + "/" + encodeURIComponent(string(calid))
            + "/" + encodeURIComponent(string(eventid));
    return JsonHttp.get(url);
  }

  // supports generic calendar
  export function postForCalendarEventsCSV(teamid: string,
    calid: string,
    q: ApiT.CalendarRequest):
    JQueryPromise<string> {
    var url = prefix + "/api/calendar/events/csv/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + encodeURIComponent(string(calid));
    return JsonHttp.post(url, JSON.stringify(q), "text");
  }

  // supports generic calendar
  export function postForCalendarStats(teamid: string, calid: string,
    q: ApiT.CalendarStatsRequest): JQueryPromise<ApiT.CalendarStatsResult> {
    var url = prefix + "/api/calendar/stats2/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + encodeURIComponent(string(calid));
    return JsonHttp.post(url, JSON.stringify(q));
  }

  export function postForDailyStats(q: ApiT.DailyStatsRequest)
    : JQueryPromise<ApiT.DailyStatsResponse>
  {
    var url = prefix + "/api/calendar/daily-stats/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify(q));
  }

  export function postEventFeedback(teamid: string, eventid: string,
    feedback: ApiT.EventFeedback): JQueryPromise<ApiT.EventFeedback>
  {
    var url = prefix + "/api/event/feedback/" + string(Login.myUid())
            + "/" + encodeURIComponent(string(teamid))
            + "/" + encodeURIComponent(string(eventid));
    return JsonHttp.post(url, JSON.stringify(feedback));
  }

  export function postEventFeedbackAction(teamid: string, calid: string,
    eventid: string, action: ApiT.EventFeedbackAction)
    : JQueryPromise<ApiT.EventFeedback>
  {
    var url = prefix + "/api/event/feedback/" + string(Login.myUid())
            + "/" + encodeURIComponent(string(teamid))
            + "/" + encodeURIComponent(string(calid))
            + "/" + encodeURIComponent(string(eventid))
            + "/" + encodeURIComponent(string(action));
    return JsonHttp.post(url, "");
  }

  export function getAllPreferences():
  JQueryPromise<ApiT.PreferencesList> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  export function getPreferences(teamid: string):
  JQueryPromise<ApiT.Preferences> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid: string, prefs: ApiT.Preferences):
  JQueryPromise<void> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(prefs));
  }

  export function setGeneralPreferences(teamid: string,
    general_prefs: ApiT.GeneralPrefsOpts): JQueryPromise<void>
  {
      var url =
          prefix + "/api/preferences/general/" + string(Login.myUid())
          + "/" + string(teamid);
      return JsonHttp.put(url, JSON.stringify(general_prefs));
  }

  /*** Emails ***/
  export function sendAgenda(teams: string[],
                             timezone: string,
                             time_from: string,
                             time_until: string,
                             html_format: boolean,
                             include_task_notes: boolean,
                             recipients: string[]):
  JQueryPromise<void> {
    var url = prefix + "/api/agenda/send/" + string(Login.myUid());
    var pref = {
      teams: teams,
      timezone: timezone,
      time_from: time_from,
      time_until: time_until,
      html_format: html_format,
      include_task_notes: include_task_notes,
      recipients: recipients
    }
    return JsonHttp.post(url, JSON.stringify(pref));
  }

  // Temporary compatibility fix. Field `label` is now optional.
  function forceLabels(x: {labels?: string[]}) {
    if (! _.isArray(x.labels)) {
      x.labels = [];
    }
    return x;
  }

  export function getEventLabels(team_id: string, event_id: string):
    JQueryPromise<{labels?: string[]}>
  {
    var url = prefix + "/api/event/labels/" + string(Login.myUid())
            + "/" + string(team_id)
            + "/" + encodeURIComponent(event_id);
    return JsonHttp.get(url).then(forceLabels);
  }

  export function updateEventLabels(team_id: string, event_id: string,
                                    labels: string[]):
  JQueryPromise<void> {
    var url = prefix + "/api/event/labels/" + string(Login.myUid())
            + "/" + string(team_id)
            + "/" + encodeURIComponent(event_id);
    return JsonHttp.post(url, JSON.stringify({labels:labels}));
  }

  export function changeEventLabels(team_id: string,
    req: ApiT.LabelChangeRequest): JQueryPromise<void>
  {
    var url = prefix + "/api/event/label-change/" + string(Login.myUid())
            + "/" + string(team_id);
    return JsonHttp.post(url, JSON.stringify(req));
  }

  export function setPredictLabels(teamId: string,
    req: ApiT.LabelsSetPredictRequest)
    : JQueryPromise<ApiT.GenericCalendarEvents>
  {
    var url = prefix + "/api/event/labels/set-predict/" + string(Login.myUid())
            + "/" + string(teamId);
    return JsonHttp.post(url, JSON.stringify(req));
  }

  export function getCustomerStatus(teamid: string):
  JQueryPromise<ApiT.CustomerStatus> {
    var url =
      prefix + "/api/pay/status/short/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getCustomerDetails(teamid: string):
  JQueryPromise<ApiT.CustomerDetails> {
    var url =
      prefix + "/api/pay/status/long/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putFiles(filename: string,
                           content_type: string,
                           contents: string):
  JQueryPromise<Esper.ApiT.GoogleDriveApi.File> {
    var query = "content_type=" + string(content_type);
    var url = prefix + "/api/files/" + string(Login.myUid()) + "/"
                                           + string(filename) + "?"
                                           + query;
    return JsonHttp.put(url, contents,
                        "json", // usual response type
                        "text/plain" // request's content-type (base64 data)
                       );
  }

  /* Team creation */
  export function createTeam(body: ApiT.TeamCreationRequest)
    : JQueryPromise<ApiT.Team>
  {
    var url = prefix + "/api/team-create/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function putTeamTimestatsCalendars(teamid: string, cals: string[])
    : JQueryPromise<ApiT.Team> {
    var url = prefix + "/api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/ts-calendars";
    return JsonHttp.put(url, JSON.stringify({ calendars: cals }));
  }

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export var setPreferences = putPreferences;

  /** Sets email types given the correct JSON object. */
  export function setEmailTypes(teamid: string, email_types: ApiT.EmailTypes):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/emails/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(email_types));
  }

  /** Sets email types given the correct JSON object. */
  export function setLabelReminderPrefs(teamid: string,
                                        email_pref: ApiT.SimpleEmailPref):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/label-reminder/"
            + string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(email_pref));
  }

  /** Set meeting feedback notification preferences */
  export function setTimestatsNotifyPrefs(teamid: string,
                    prefs: ApiT.TimestatsNotifyPrefs): JQueryPromise<void> {
    var url = prefix + "/api/preferences/notify/"
            + string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(prefs));
  }

  /** Sets general prefs given the correct JSON object. */
  export var setGeneralPrefs = setGeneralPreferences;


  /*** Payments ***/

  export function getSubscriptionStatus(teamid: string):
    JQueryPromise<ApiT.CustomerStatus> {
    var url = prefix + "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getSubscriptionStatusLong(teamid: string):
    JQueryPromise<ApiT.CustomerDetails> {
    var url = prefix + "/api/pay/status/long/" + string(Login.me())
      + "/" + string(teamid);

    return JsonHttp.get(url);
  }

  export function setSubscription(teamid: string, planid: string):
    JQueryPromise<void> {
    var url = prefix + "/api/pay/subscribe/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(planid);
    return JsonHttp.post(url, "");
  }

  export function cancelSubscription(teamid: string):
    JQueryPromise<void> {
    var url = prefix + "/api/pay/unsubscribe/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.post(url, "");
  }

  export function addNewCard(teamid: string, cardToken: string):
    JQueryPromise<ApiT.PaymentCard> {
    var url = prefix + "/api/pay/new-card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(cardToken));
    return JsonHttp.post(url, "");
  }

  export function deleteCard(teamid: string, cardid: string):
    JQueryPromise<void> {
    var url = prefix + "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return JsonHttp.delete_(url);
  }

  export function setDefaultCard(teamid: string, cardid: string):
    JQueryPromise<void> {
    var url = prefix + "/api/pay/card/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(cardid);
    return JsonHttp.put(url, "");
  }

  export function getEventColors():
    JQueryPromise<ApiT.CalendarEventPalette> {
    var url = prefix + "/api/gcal/colors/event/" + string(Login.me());
    return JsonHttp.get(url);
  }

  /* Support */

  export function sendSupportEmail(msg: string): JQueryPromise<void> {
    var url = prefix + "/api/support/email";
    var feedback: { body: string, user?: string } = { body: msg };
    var uid = Login.me();
    if (uid) {
      url += ("/" + uid);
      feedback.user = uid;
    }
    return JsonHttp.post(url, JSON.stringify(feedback));
  }
}
