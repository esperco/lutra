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

  type JsonPromise<T> = JsonHttp.Promise<T>;

  // Initialize defaults depending on whether we're in production mode
  if (Esper.PRODUCTION) {
    prefix = "https://app.esper.com";
  } else {
    // No port (assume API server is on Port 80)
    prefix = window.location.protocol + "//" + window.location.hostname;
  }

  export function clock(): JsonPromise<ApiT.ClockResponse> {
    return JsonHttp.get(prefix + "/clock");
  }

  export function echo(serializable: any) {
    return JsonHttp.post(prefix + "/echo",
                         serializable);
  }

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.

    This URL-encodes the string, as needed.
  */
  function string(x: string) {
    Log.assert(x !== undefined && x !== null);
    return encodeURIComponent(x);
  }

  function number(x: number): string {
    console.assert(x !== undefined && x !== null);
    return x.toString();
  }


  /* Batch helpers */

  export function batch<T>(fn: () => JQueryPromise<T>): JsonPromise<T>;
  export function batch<T>(fn: () => T): JsonPromise<T>;
  export function batch<T>(fn: () => T|JQueryPromise<T>): JsonPromise<T> {
    var url = prefix + "";
    return JsonHttp.batch(fn, prefix + "/http-batch-request");
  }


  /* Esper login and password management */

  export function sandboxSignup(): JsonPromise<ApiT.LoginResponse> {
    var url = prefix + "/api/sandbox/signup";
    return JsonHttp.post(url, "");
  }

  export function sandboxLogin(email: string): JsonPromise<ApiT.LoginResponse> {
    var url = prefix + "/api/sandbox/login/" + string(email);
    return JsonHttp.get(url);
  }

  export function getLoginInfo():
  JsonPromise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + string(Login.myUid()) + "/info" +
      "?filter_groups_only=false";
    return JsonHttp.get(url);
  }

  export function patchFeatureFlags(flags: ApiT.FeatureFlagsPatch)
    : JsonPromise<ApiT.FeatureFlags>
  {
    var uid = string(Login.myUid());
    var url = prefix + "/api/feature-flags/" + uid + "/" + uid;
    return JsonHttp.patch(url, flags);
  }

  export function loginAs(theirEmail: string):
    JsonPromise<ApiT.LoginResponse> {
    return JsonHttp.get(prefix + "/api/login-as/" + string(Login.me())
      + "/" + string(theirEmail));
  }

  export function loginOnce(uid: string, loginNonce: string):
    JsonPromise<ApiT.LoginResponse> {
    return JsonHttp.post(prefix + "/api/login/" + string(uid)
      + "/once/" + string(loginNonce),
      "");
  }

  export function deactivate(uid?: string): JsonPromise<void> {
    uid = uid || Login.myUid();
    return JsonHttp.post(
      prefix + `/api/deactivate/${Login.myUid()}/${uid}`,
      "");
  }

  export function random():
    JsonPromise<ApiT.Random> {
    return JsonHttp.post(prefix + "/api/random");
  }

  /*** Esper team management ***/

  export function getTeam(teamId: string): JsonPromise<ApiT.Team> {
    return JsonHttp.get(prefix + "/api/team/" + string(Login.myUid())
      + "/" + string(teamId));
  }

  export function getTeamsForUser(groupsOnly?: boolean):
    JsonPromise<ApiT.TeamList> {
    var filterGroupsOnly = _.isUndefined(groupsOnly) ? "" :
      `?filter_groups_only=${groupsOnly}`;
    return JsonHttp.get(`${prefix}/api/teams/${string(Login.me())}`
      + `${filterGroupsOnly}`);
  }

  export function deactivateTeam(teamId: string): JsonPromise<void> {
    return JsonHttp.post(prefix + "/api/deactivate-team/" +
      string(Login.myUid()) + "/" + string(teamId));
  }

  export function inviteCreateTeam():
    JsonPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var invite = { from_uid: fromUid };
    return JsonHttp.post(prefix + "/api/invite/" + string(fromUid) +
      "/create-team", invite);
  }

  export function inviteJoinTeam(invite: ApiT.InviteJoinTeam):
    JsonPromise<void> {
    return JsonHttp.post(prefix + "/api/invite/" + string(Login.me()) +
      "/join-team", invite);
  }

  export function setTeamName(teamid: string, name: string):
    JsonPromise<void> {
    var fromUid = Login.me();
    return JsonHttp.put(prefix + "/api/team-name/" + string(fromUid)
      + "/" + string(teamid)
      + "/" + string(name),
      "");
  }

  export function approveTeam(teamid: string): JsonPromise<void> {
    return JsonHttp.put(prefix + "/api/team-approve/" + string(Login.me()) +
      "/" + string(teamid) + "/true");
  }

  export function setTeamOwner(teamid: string, uid: string):
    JsonPromise<void> {
    return JsonHttp.put(prefix + "/api/team-owner/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  export function setTeamCalUser(teamid: string, uid: string):
    JsonPromise<void> {
    return JsonHttp.put(prefix + "/api/team-cal-user/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  // restricted to admins and executive themselves
  export function addAssistant(teamid: string, uid: string):
    JsonPromise<ApiT.Team> {
    return JsonHttp.put(prefix + "/api/team-assistant/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(uid),
      "");
  }

  export function removeAssistant(teamid: string, memberUid: string):
    JsonPromise<void>
  {
    return JsonHttp.delete_(prefix + "/api/team/" + string(Login.me())
      + "/" + string(teamid)
      + "/member/" + string(memberUid));
  }

  /***** Opaque URLs with unique token *****/

  export function getToken(token: string): JsonPromise<ApiT.TokenInfo> {
    return JsonHttp.get(prefix + "/api/token/" +
      string(token));
  }

  export function postToken(token: string): JsonPromise<ApiT.TokenResponse> {
    return JsonHttp.noWarn(function() {
      return JsonHttp.post(prefix + "/api/token/"
                           + string(token));
    });
  }

  export function postTokenEmail(token: string, email: string, name: string):
    JsonPromise<ApiT.TokenResponse> {
    var path = prefix +
      "/api/token-email/" + string(token)
      + "/" + string(email)
      + "/" + string(name);
    return JsonHttp.post(path);
  }


  /***** Google authentication and permissions *****/

  export function getGoogleAuthUrl(optAuthLandingUrl: string,
    optLoginNonce: string,
    optInvite: string,
    optEmail: string,
    optGmail?: boolean): JsonPromise<ApiT.UrlResult>
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
    optAuthLandingUrl: string): JsonPromise<ApiT.UrlResult>
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
    JsonPromise<ApiT.GoogleAuthInfo>
  {
    var url = prefix + "/api/google/" + string(Login.me()) + "/auth/info";
    if (_.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return JsonHttp.get(url);
  }

  export function postGoogleAuthRevoke():
    JsonPromise<any>
  {
    var url = prefix + "/api/google/" + string(Login.me()) + "/auth/revoke";
    return JsonHttp.post(url);
  }

  /***** Nylas *****/
  export function getNylasLoginUrl(email: string,
                                   nonce: string,
                                   landing_url?: string,
                                   invite?: string):
    JsonPromise<ApiT.UrlResult> {
      var inviteParam = invite ? "&invite=" + invite : "";
      var url = prefix + "/api/nylas/login/" + string(email) +
        "?nonce=" + string(nonce) +
        inviteParam;
      if (landing_url)
        url += "&landing_url=" + string(landing_url);
    return JsonHttp.get(url);
  }

  /***** Slack *****/
  export function getSlackAuthInfo(teamid: string):
  JsonPromise<ApiT.SlackAuthInfo> {
    var url = prefix + "/api/slack/auth-info/" + string(Login.me())
            + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  /***** Team label syncing *****/

  export function getSyncedLabels(teamid: string):
    JsonPromise<ApiT.LabelInfos> {
    var url = prefix + "/api/team/labels/" + string(Login.me()) +
      "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putSyncedLabels(teamid: string, labels: {labels: string[]}):
    JsonPromise<void> {
    var url = prefix + "/api/team/labels/" + string(Login.me()) +
      "/" + string(teamid);
    return JsonHttp.put(url, labels);
  }

  export function putGroupLabels(groupid: string, labels: {labels: string[]}):
    JsonPromise<void>
  {
    var url = prefix + "/api/group/labels/" + string(Login.me())
      + "/" + string(groupid);
    return JsonHttp.put(url, labels);
  }

  export function setLabelColor(teamid: string, req: ApiT.SetLabelColorRequest):
    JsonPromise<ApiT.LabelInfo> {
    var url = `${prefix}/api/team-label/set-color/${string(Login.me())}`
      + `/${string(teamid)}`;
    return JsonHttp.post(url, req);
  }

  export function setGroupLabelColor(
    groupid: string, req: ApiT.SetLabelColorRequest
  ): JsonPromise<ApiT.LabelInfo> {
    var url = `${prefix}/api/group-label/set-color/${string(Login.me())}`
      + `/${string(groupid)}`;
    return JsonHttp.post(url, req);
  }


  /***** Google profile information *****/

  export function getGoogleEmail(myUID: string, theirUID: string,
    teamid: string): JsonPromise<ApiT.AccountEmail>
  {
    var url = prefix +
      "/api/google/email/" + string(myUID)
      + "/" + string(theirUID)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getProfile(uid: string, teamid: string):
    JsonPromise<ApiT.Profile> {
    var url =
      prefix + "/api/profile/" + string(Login.myUid())
      + "/" + string(uid)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getAllTeamProfiles():
  JsonPromise<ApiT.ProfileList> {
    var url =
      prefix + "/api/profile/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  // Alias used in Otter
  export var getAllProfiles = getAllTeamProfiles;

  export function getMyProfile(): JsonPromise<ApiT.Profile> {
    var url = prefix + "/api/profile/" + string(Login.myUid()) + "/me";
    return JsonHttp.get(url);
  }

  export function putTeamEmails(teamid: string, aliases: ApiT.EmailAddresses):
    JsonPromise<ApiT.EmailAddresses> {
    var url = prefix + "api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/emails";
    return JsonHttp.put(url, aliases);
  }

  // supports generic calendar
  export function getGenericCalendarList(teamid: string):
    JsonPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/calendars/" + string(Login.myUid())
            + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getGenericCalendarListOfUser():
    JsonPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/calendars/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  export function getTimestatsCalendarList(teamid: string):
    JsonPromise<ApiT.GenericCalendars> {
    var url = prefix + "/api/ts/ts-calendars/" + string(Login.myUid())
            + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function postForTeamEvents(teamId: string, q: ApiT.CalendarRequest):
    JsonPromise<ApiT.GenericCalendarEvents>
  {
    var url = prefix + "/api/ts/events-team/" + string(Login.myUid())
            + "/" + string(teamId);
    return JsonHttp.post(url, q);
  }

  export function getEventExact(teamid: string,
                                calid: string,
                                eventid: string):
  JsonPromise<ApiT.GenericCalendarEvent> {
    var url = prefix + "/api/ts/events/" + string(Login.myUid())
            + "/" + string(teamid)
            + "/" + string(calid)
            + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function getEventFuzzy(eventid: string, teamid?: string):
  JsonPromise<ApiT.EventLookupResponse> {
    var url = `${prefix}/api/ts/event/${string(Login.me())}`
      + `/${string(eventid)}`
      + (teamid ? `?teamid=${string(teamid)}` : "");
    return JsonHttp.get(url);
  }

  // supports generic calendar
  export function postForCalendarEventsCSV(teamid: string,
    q: ApiT.CalendarRequest):
    JsonPromise<string> {
    var url = prefix + "/api/ts/events-csv/" + string(Login.myUid())
            + "/" + string(teamid);
    return JsonHttp.httpRequest("POST", url,
      JSON.stringify(q),
      "text",
      "application/json; charset=UTF-8"
    );
  }

  export function postEventFeedback(teamid: string, eventid: string,
    feedback: ApiT.EventFeedbackUpdate): JsonPromise<ApiT.EventFeedback>
  {
    var url = prefix + "/api/event/feedback/" + string(Login.myUid())
            + "/" + string(teamid)
            + "/" + string(eventid);
    return JsonHttp.post(url, feedback);
  }

  export function postEventFeedbackAction(teamid: string, calid: string,
    eventid: string, action: ApiT.EventFeedbackAction)
    : JsonPromise<ApiT.EventFeedback>
  {
    var url = prefix + "/api/event/feedback/" + string(Login.myUid())
            + "/" + string(teamid)
            + "/" + string(calid)
            + "/" + string(eventid)
            + "/" + string(action);
    return JsonHttp.post(url);
  }

  export function getAllPreferences():
  JsonPromise<ApiT.PreferencesList> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  export function getPreferences(teamid: string):
  JsonPromise<ApiT.Preferences> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid: string, prefs: ApiT.Preferences):
  JsonPromise<void> {
    var url =
      prefix + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.put(url, prefs);
  }

  export function setGeneralPreferences(teamid: string,
    general_prefs: ApiT.GeneralPrefsOpts): JsonPromise<void>
  {
      var url =
          prefix + "/api/preferences/general/" + string(Login.myUid())
          + "/" + string(teamid);
      return JsonHttp.put(url, general_prefs);
  }

  /*** Emails ***/
  export function sendAgenda(teams: string[],
                             timezone: string,
                             time_from: string,
                             time_until: string,
                             html_format: boolean,
                             include_task_notes: boolean,
                             recipients: string[]):
  JsonPromise<void> {
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
    return JsonHttp.post(url, pref);
  }

  // Temporary compatibility fix. Field `label` is now optional.
  function forceLabels(x: {labels?: string[]}) {
    if (! _.isArray(x.labels)) {
      x.labels = [];
    }
    return x;
  }

  export function getEventLabels(team_id: string, event_id: string):
    JsonPromise<{labels?: string[]}>
  {
    var url = prefix + "/api/event/labels/" + string(Login.myUid())
            + "/" + string(team_id)
            + "/" + string(event_id);
    return JsonHttp.get(url).then(forceLabels);
  }

  export function updateEventLabels(team_id: string, event_id: string,
                                    labels: string[]):
  JsonPromise<void> {
    var url = prefix + "/api/event/labels/" + string(Login.myUid())
            + "/" + string(team_id)
            + "/" + string(event_id);
    return JsonHttp.post(url, {labels:labels});
  }

  export function changeEventLabels(team_id: string,
    req: ApiT.LabelChangeRequest): JsonPromise<void>
  {
    var url = prefix + "/api/event/label-change/" + string(Login.myUid())
            + "/" + string(team_id);
    return JsonHttp.post(url, req);
  }

  export function changeGroupEventLabels(groupId: string,
    req: ApiT.LabelChangeRequest): JsonPromise<void>
  {
    var url = prefix + "/api/group/event/label-change/" + string(Login.myUid())
            + "/" + string(groupId);
    return JsonHttp.post(url, req);
  }

  export function setPredictLabels(teamId: string,
    req: ApiT.LabelsSetPredictRequest)
    : JsonPromise<ApiT.GenericCalendarEvents>
  {
    var url = prefix + "/api/event/labels/set-predict/" + string(Login.myUid())
            + "/" + string(teamId);
    return JsonHttp.post(url, req);
  }


  /* Team creation */
  export function createTeam(body: ApiT.TeamCreationRequest)
    : JsonPromise<ApiT.Team>
  {
    var url = prefix + "/api/team-create/" + string(Login.myUid());
    return JsonHttp.post(url, body);
  }

  export function putTeamTimestatsCalendars(teamid: string, cals: string[])
    : JsonPromise<ApiT.Team> {
    var url = prefix + "/api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/ts-calendars";
    return JsonHttp.put(url, { calendars: cals });
  }

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export var setPreferences = putPreferences;

  /** Sets email types given the correct JSON object. */
  export function setEmailTypes(teamid: string, email_types: ApiT.EmailTypes):
    JsonPromise<void> {
    var url = prefix + "/api/preferences/emails/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, email_types);
  }

  /** Sets email types given the correct JSON object. */
  export function setLabelReminderPrefs(teamid: string,
                                        email_pref: ApiT.SimpleEmailPref):
    JsonPromise<void> {
    var url = prefix + "/api/preferences/label-reminder/"
            + string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, email_pref);
  }

  /** Sets general prefs given the correct JSON object. */
  export var setGeneralPrefs = setGeneralPreferences;


  /*** Payments ***/

  export function createCustomer(uid?: string): JsonPromise<ApiT.Customer> {
    var url = prefix + "/api/pay/customer/create/"
            + string(Login.me()) + "/" + string(uid || Login.me());
    return JsonHttp.post(url);
  }

  export function listCustomers(uid?: string): JsonPromise<ApiT.CustomerList> {
    var url = prefix + "/api/pay/customer/list/"
            + string(Login.me()) + "/" + string(uid || Login.me());
    return JsonHttp.get(url);
  }

  export function setCustomerFilter(
    cusId: string,
    req: ApiT.CustomerTeamFilterReq
  ) : JQueryPromise<void> {
    var url = prefix + "/api/pay/customer/filter/"
            + string(Login.me()) + "/" + string(cusId);
    return JsonHttp.put(url, req);
  }

  export function requestCustomerSeat(teamId: string, email: string)
    : JQueryPromise<ApiT.CustomerRequestSeatResponse>
  {
    var url = prefix + "/api/pay/customer/request-seat/"
            + string(Login.me()) + "/" + string(teamId) + "/" + string(email);
    return JsonHttp.post(url);
  }

  export function acceptCustomerSeat(cusId: string, teamId: string)
    : JQueryPromise<void>
  {
    var url = prefix + "/api/pay/customer/accept-seat/"
            + string(Login.me()) + "/" + string(cusId) + "/" + string(teamId);
    return JsonHttp.put(url);
  }

  export function rejectCustomerSeat(cusId: string, teamId: string)
    : JQueryPromise<void>
  {
    var url = prefix + "/api/pay/customer/reject-seat/"
            + string(Login.me()) + "/" + string(cusId) + "/" + string(teamId);
    return JsonHttp.put(url);
  }

  export function setCustomerPrimaryContact(cusId: string, contactId: string)
    : JQueryPromise<void>
  {
    var url = prefix + "/api/pay/customer/primary-contact/"
            + string(Login.me()) + "/" + string(cusId) + "/"
            + string(contactId);
    return JsonHttp.put(url);
  }

  export function addCustomerSecondaryContact(
    cusId: string, contactId: string
  ): JQueryPromise<void> {
    var url = prefix + "/api/pay/customer/secondary-contact/"
            + string(Login.me()) + "/" + string(cusId) + "/"
            + string(contactId);
    return JsonHttp.put(url);
  }

  export function removeCustomerSecondaryContact(
    cusId: string, contactId: string
  ) {
    var url = prefix + "/api/pay/customer/secondary-contact/"
            + string(Login.me()) + "/" + string(cusId) + "/"
            + string(contactId);
    return JsonHttp.delete_(url);
  }

  export function getSubscriptionStatus(cusid: string):
    JsonPromise<ApiT.TeamSubscription> {
    var url = prefix + "/api/pay/status/short/" + string(Login.me())
      + "/" + string(cusid);
    return JsonHttp.get(url);
  }

  export function getSubscriptionStatusLong(cusid: string):
    JsonPromise<ApiT.SubscriptionDetails> {
    var url = prefix + "/api/pay/status/long/" + string(Login.me())
      + "/" + string(cusid);

    return JsonHttp.get(url);
  }

  export function setSubscription(cusid: string, planid: ApiT.PlanId):
    JsonPromise<void> {
    var url = prefix + "/api/pay/subscribe/" + string(Login.me())
      + "/" + string(cusid)
      + "/" + string(planid);
    return JsonHttp.post(url);
  }

  export function cancelSubscription(cusid: string):
    JsonPromise<void> {
    var url = prefix + "/api/pay/unsubscribe/" + string(Login.me())
      + "/" + string(cusid);
    return JsonHttp.post(url);
  }

  export function addNewCard(cusid: string, cardToken: string):
    JsonPromise<ApiT.PaymentCard> {
    var url = prefix + "/api/pay/new-card/" + string(Login.me())
      + "/" + string(cusid)
      + "/" + string(cardToken);
    return JsonHttp.post(url);
  }

  export function deleteCard(cusid: string, cardid: string):
    JsonPromise<void> {
    var url = prefix + "/api/pay/card/" + string(Login.me())
      + "/" + string(cusid)
      + "/" + string(cardid);
    return JsonHttp.delete_(url);
  }

  export function setDefaultCard(cusid: string, cardid: string):
    JsonPromise<void> {
    var url = prefix + "/api/pay/card/" + string(Login.me())
      + "/" + string(cusid)
      + "/" + string(cardid);
    return JsonHttp.put(url);
  }

  export function getEventColors():
    JsonPromise<ApiT.CalendarEventPalette> {
    var url = prefix + "/api/gcal/colors/event/" + string(Login.me());
    return JsonHttp.get(url);
  }

  /* Support */

  export function sendSupportEmail(msg: string): JsonPromise<void> {
    var url = prefix + "/api/support/email";
    var feedback: { body: string, user?: string } = { body: msg };
    var uid = Login.me();
    if (uid) {
      url += ("/" + uid);
      feedback.user = uid;
    }
    return JsonHttp.post(url, feedback);
  }
}
