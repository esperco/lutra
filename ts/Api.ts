/*
  Communicate with API server (Wolverine). A little bulky to put everything
  in one module but less of a headache than keeping everything separate
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="./JsonHttp.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Log.ts" />
/// <reference path="./Unixtime.ts" />

module Esper.Api {

  // Change prefix in init code depending on where API server is
  export var prefix = "";

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

  export function random():
    JQueryPromise<ApiT.Random> {
    return JsonHttp.post(prefix + "/api/random", "");
  }

  /*** Esper team management ***/

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

  export function refer(): JQueryPromise<ApiT.UrlResult> {
    var fromUid = Login.me();
    var refer = { from_uid: fromUid };
    return JsonHttp.post(prefix + "/api/invite/" + string(fromUid) + "/refer",
      JSON.stringify(refer));
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

  export function setExecutive(teamid: string, memberUid: string): 
    JQueryPromise<void>
  {
    return JsonHttp.put(prefix + "/api/team/" + Login.me() + "/" + teamid
      + "/executive/" + memberUid, "");
  }

  export function setPrimaryAssistant(teamid: string, uid: string):
    JQueryPromise<ApiT.Team> {
    return JsonHttp.put(prefix + "/api/team-primary/" + string(Login.me())
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

  /***** Opaque URLs with unique token *****/

  /*
    Post an opaque token provided in a URL of the form:

      https://app.esper.com/#!t/XXXXXX

    The response describes what has be done and what can be done next.
    This is used for invites and other URLs that are given out to users.
   */
  export function postToken(token: string): JQueryPromise<ApiT.TokenInfo> {
    return JsonHttp.post(prefix + "/api/token/" +
      encodeURIComponent(string(token)), "");
  }

  export function postTokenEmail(token: string, email: string, name: string):
    JQueryPromise<ApiT.TokenInfo> {
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
    optEmail: string): JQueryPromise<ApiT.UrlResult>
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
  export function getNylasLoginUrl(email: string):
    JQueryPromise<ApiT.UrlResult> {
    var url = prefix + "/api/inbox/login/" + encodeURIComponent(email);
    return JsonHttp.get(url);
  }

  export function setupNylasCalendar(teamid: string,
    execName: string,
    timezone: string):
    JQueryPromise<void> {
    var url = prefix + "/api/inbox/setup-calendar/" +
      string(Login.me()) + "/" +
      encodeURIComponent(teamid) + "/" +
      encodeURIComponent(execName) + "/" +
      encodeURIComponent(timezone);
    return JsonHttp.post(url);
  }

  /***** Team label syncing *****/

  export function getSyncedLabels(teamid: string):
    JQueryPromise<ApiT.EmailLabels> {
    var url = prefix + "/api/labels/synced/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putSyncedLabels(teamid: string, labels: {labels: string[]}):
    JQueryPromise<void> {
    var url = prefix + "/api/labels/synced/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(labels));
  }

  export function getSharedLabels(teamid: string):
    JQueryPromise<ApiT.EmailLabels> {
    var url = prefix + "/api/labels/shared/" + string(teamid);
    return JsonHttp.get(url);
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

  export function getThreadDetails(threadId: string):
  JQueryPromise<ApiT.EmailThread> {
    var url =
      prefix + "/api/thread/details/" + string(Login.myUid())
      + "/" + string(threadId);
    return JsonHttp.get(url);
  }

  export function getLinkedThreads(teamid: string, eventId: string):
  JQueryPromise<ApiT.LinkedEmailThreads> {
    var url =
      prefix + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  function calIds(teamCalendars: ApiT.Calendar[]): string[] {
    return _.map(teamCalendars, function(cal) {
      return cal.google_cal_id;
    });
  }

  export function getLinkedEvents(teamid: string,
                                  threadId: string,
                                  teamCalendars: ApiT.Calendar[]):
  JQueryPromise<ApiT.TaskEvent[]> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      prefix + "/api/thread/events/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId);
    return JsonHttp.post(url, JSON.stringify(cals)).then(function(x) {
      return x.linked_events;
    });
  }

  export function linkEventForMe(teamid: string, threadId: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function linkEventForTeam(teamid: string, threadId: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, "");
  }

  export function unlinkEvent(teamid: string, threadId: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function syncEvent(teamid: string, threadId: string, calid: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid: string, threadId: string, calid: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function deleteLinkedEvent(teamid: string, threadId: string,
    eventId: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function updateLinkedEvent(teamid: string, threadId: string,
    eventId: string, eventEdit: ApiT.CalendarEventEdit): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, JSON.stringify(eventEdit));
  }

  export function eventSearch(teamid: string, teamCalendars: ApiT.Calendar[],
    query: string): JQueryPromise<ApiT.CalendarEventList>
  {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      prefix + "/api/calendar/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(query);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function eventRange(teamid: string, teamCalendars: ApiT.Calendar[],
                             from: number, until: number):
  JQueryPromise<ApiT.CalendarEventList> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      prefix + "/api/calendar/range/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + from.toString()
      + "/" + until.toString();
    return JsonHttp.post(url, JSON.stringify(cals));
  }


  export function getEventThreads(teamid: string, eventId: string):
  JQueryPromise<ApiT.LinkedEmailThreads> {
    var url =
      prefix + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  export function getEventDetails(teamid: string, calid: string,
    teamCalendars: ApiT.Calendar[], eventid: string):
    JQueryPromise<ApiT.CalendarEventOpt>
  {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      prefix + "/api/event/details-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(calid))
      + "/" + encodeURIComponent(string(eventid));
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function createTaskLinkedEvent(createdBy: string, teamid: string,
                                        event: ApiT.CalendarEventEdit,
                                        taskId: string):
  JQueryPromise<ApiT.CalendarEvent> {
    var url =
      prefix + "/api/task/put-linked-event/" + string(Login.myUid())
      + "/" + string(createdBy)
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(event.google_cal_id))
      + "/" + string(taskId);
    return JsonHttp.post(url, JSON.stringify(event));
  }

  /*** Scheduling ***/

  export function getCalendarList(teamid?: string)
    : JQueryPromise<ApiT.Calendars> {
    var url = prefix + "/api/calendar/list/" + string(Login.myUid());
    if (teamid) {
      url += "/" + string(teamid);
    }
    return JsonHttp.get(url);
  }

  export function getCalendarShares(cal: ApiT.Calendar):
    JQueryPromise<ApiT.CalendarAcl>
  {
    var calspec = {
      google_cal_id: cal.google_cal_id,
      authorized_as: cal.authorized_as
    };
    var url = prefix + "api/calendar/share/list/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify(calspec));
  }

  export function putCalendarShare(cal: ApiT.Calendar, email: string):
    JQueryPromise<void>
  {
    var calspec = {
      google_cal_id: cal.google_cal_id,
      authorized_as: cal.authorized_as
    };
    var url = prefix + "api/calendar/share/add/"
      + string(Login.myUid()) + "/"
      + encodeURIComponent(string(email));
    return JsonHttp.put(url, JSON.stringify(calspec));
  }

  export function deleteCalendarShare(cal: ApiT.Calendar, rule_id: string):
    JQueryPromise<void>
  {
    var calspec = {
      google_cal_id: cal.google_cal_id,
      authorized_as: cal.authorized_as
    };
    var url = prefix + "api/calendar/share/remove/"
      + string(Login.myUid()) + "/"
      + encodeURIComponent(string(rule_id));
    return JsonHttp.post(url, JSON.stringify(calspec));
  }

  export function createTeamCalendar(forUid: string, teamid: string,
    tz: string, name: string): JQueryPromise<void>
  {
    var url = prefix + "api/calendar/share/create/"
      + string(Login.myUid()) + "/"
      + string(forUid) + "/"
      + encodeURIComponent(string(teamid)) + "/"
      + encodeURIComponent(string(tz)) + "/"
      + encodeURIComponent(string(name));
    return JsonHttp.post(url, "");
  }

  export function putTeamEmails(teamid: string, aliases: ApiT.EmailAddresses):
    JQueryPromise<ApiT.EmailAddresses> {
    var url = prefix + "api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/emails";
    return JsonHttp.put(url, JSON.stringify(aliases));
  }

  export function putAccountEmails(teamid: string, theirUID: string,
    aliases: ApiT.EmailAddresses): JQueryPromise<ApiT.EmailAddresses>
  {
    var url = prefix + "api/account/emails/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + string(theirUID);
    return JsonHttp.put(url, JSON.stringify(aliases));
  }

  export function postForCalendarEventsCSV(teamid: string,
    calid: string,
    q: ApiT.CalendarRequest):
    JQueryPromise<string> {
    var url = prefix + "/api/calendar/events/csv/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + string(calid);
    return JsonHttp.post(url, JSON.stringify(q), "text");
  }

  export function postForCalendarStats(teamid: string, calid: string,
    q: ApiT.CalendarRequest): JQueryPromise<ApiT.CalendarStats> {
    var url = prefix + "/api/calendar/stats/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + string(calid);
    return JsonHttp.post(url, JSON.stringify(q));
  }

  export function postCalendarShow(teamid: string,
    teamCalendars: ApiT.Calendar[]): JQueryPromise<void> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url = prefix + "/api/calendar/show/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShowAll():
  JQueryPromise<void> {
    var url = prefix + "/api/calendar/show-all/" + string(Login.myUid());
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
    general_prefs: ApiT.GeneralPrefs): JQueryPromise<void>
  {
      var url =
          prefix + "/api/preferences/general/" + string(Login.myUid())
          + "/" + string(teamid);
      return JsonHttp.put(url, JSON.stringify(general_prefs));
  }

  export function getPreferenceChanges(teamid: string, from: number,
    until: number): JQueryPromise<ApiT.PreferenceChanges>
  {
    var url =
      prefix + "/api/preferences/changes/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + from.toString() + "/" + until.toString();
    return JsonHttp.get(url);
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

  export function agendaRange(teamid: string,
                              timezone: string,
                              from: number,
                              until: number):
  JQueryPromise<ApiT.AgendaEventList> {
    var url = prefix + "/api/agenda/range/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(timezone))
      + "/" + from.toString()
      + "/" + until.toString();
    return JsonHttp.get(url);
  }

  export function setReminderTime(teamid: string, from_email: string,
    calid: string, eventid: string, secs: number): JQueryPromise<void>
  {
    var url =
      prefix + "/api/event/set-reminder-time/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(from_email)
      + "/" + string(calid)
      + "/" + string(eventid)
      + "/" + secs.toString();
    return JsonHttp.post(url, "");
  }

  export function unsetReminderTime(eventid: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/event/unset-reminder-time/" + string(Login.myUid())
      + "/" + string(eventid);
    return JsonHttp.post(url, "");
  }

  export function getReminders(calid: string, eventid: string):
  JQueryPromise<ApiT.EventReminders> {
    var url =
      prefix + "/api/event/reminders/" + string(Login.myUid())
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function enableReminderForGuest(eventid: string, email: string,
                                         guest_reminder : ApiT.GuestReminder):
  JQueryPromise<void> {
    var url =
      prefix + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.put(url, JSON.stringify(guest_reminder));
  }

  export function disableReminderForGuest(eventid: string, email: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.delete_(url);
  }

  export function getDefaultReminder(teamid: string, calid: string,
    eventid: string): JQueryPromise<ApiT.DefaultReminder>
  {
    var url =
      prefix + "/api/event/default-reminder/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function postCalendar(teamid: string, calid: string,
                               calRequest : ApiT.CalendarRequest):
  JQueryPromise<ApiT.CalendarEventList> {
    var url =
      prefix + "/api/calendar/events/view/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid);
    return JsonHttp.post(url, JSON.stringify(calRequest));
  }

  export function obtainTaskForEvent(teamid: string,
                                     calid: string, eventid: string,
                                     newTask: ApiT.NewTask,
                                     withEvents: boolean,
                                     withThreads: boolean):
  JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/event/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid)
      + "/" + string(eventid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.post(url, JSON.stringify(newTask));
  }

  export function getTaskListForEvent(eventid: string,
                                      withEvents: boolean,
                                      withThreads: boolean):
  JQueryPromise<ApiT.Task[]> {
    var url =
      prefix + "/api/event/task-list/" + string(Login.myUid())
      + "/" + string(eventid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.tasks; });
  }

  export function obtainTaskForThread(teamid: string, threadid: string,
                                      withEvents: boolean,
                                      withThreads: boolean):
  JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + threadid
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url);
  }

  export function getTaskListForThread(threadid: string,
                                       withEvents: boolean,
                                       withThreads: boolean):
  JQueryPromise<ApiT.Task[]> {
    var url =
      prefix + "/api/thread/task-list/" + string(Login.myUid())
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.tasks; });
  }

  export function getTaskForThread(teamid: string, threadid: string,
                                   withEvents: boolean,
                                   withThreads: boolean):
  JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/thread/task-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.task; });
  }

  export function getTask(taskid: string,
                          withEvents: boolean,
                          withMessages: boolean): JQueryPromise<ApiT.Task> {
    var url = prefix + "/api/task/details/" + string(Login.myUid())
            + "/" + string(taskid)
            + "?events=" + withEvents.toString()
            + "&messages=" + (withMessages ? "id" : "no");
    return JsonHttp.get(url);
  }

  export function archiveTask(taskid: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/task/archive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unarchiveTask(taskid: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/task/unarchive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function linkThreadToTask(teamid: string, threadid: string,
    taskid: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unlinkThreadFromTask(teamid: string, threadid: string,
    taskid: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.delete_(url);
  }

  export function switchTaskForThread(teamid: string, threadid: string,
    old_taskid: string, new_taskid: string): JQueryPromise<void>
  {
    var url =
      prefix + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(old_taskid)
      + "/" + string(new_taskid);
    return JsonHttp.put(url, "");
  }

  export function setTaskTitle(taskid: string, title: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/task/title/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + encodeURIComponent(string(title));
    return JsonHttp.put(url, "");
  }

  export function setTaskMeetingType(taskid: string, mtype: string):
  JQueryPromise<void> {
    var url =
      prefix + "/api/task/meeting-type/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + encodeURIComponent(string(mtype));
    return JsonHttp.put(url, "");
  }

  export function setTaskNotes(taskid: string, notes: string):
  JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/task/notes/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, string(notes));
  }

  export function setTaskNotesQuill(taskid: string, notes: string):
    JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/task/notes/quill/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, string(notes));
  }

  export function setTaskProgress(taskid: string, progress: string):
  JQueryPromise<ApiT.Task> {
    var url =
      prefix + "/api/task/label/progress/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + string(progress);
    return JsonHttp.put(url, "");
  }

  export function setTaskLabels(teamid: string,
                                taskid: string,
                                labels: string[]): JQueryPromise<void> {
    var url =
      prefix + "/api/task/label/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.post(url, JSON.stringify({labels:labels}));
  }

  export function searchTasks(teamid: string, query: string):
  JQueryPromise<ApiT.TaskSearchResults> {
    var url =
      prefix + "/api/tasks/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(query));
    return JsonHttp.get(url);
  }

  export function getTaskPage(url: string):
  JQueryPromise<ApiT.TaskList> {
    return JsonHttp.get(url);
  }

  export function getTaskList(teamid: string,
                              pageSize: number,
                              withEvents: boolean,
                              withThreads: boolean):
  JQueryPromise<ApiT.TaskList> {
    var url =
      prefix + "/api/tasks/page/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + pageSize.toString()
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return getTaskPage(url);
  }

  export function sendTaskList(teams: string[],
                               labels: string[],
                               progress: string[],
                               html_format: boolean,
                               recipients: string[]):
  JQueryPromise<void> {
    var url =
      prefix + "/api/tasks/send/" + string(Login.myUid());
    var params = { teams: teams,
                   labels: labels,
                   progress: progress,
                   html_format: html_format,
                   recipients: recipients
                 };
    return JsonHttp.post(url, JSON.stringify(params));
  }

  export function getThreadParticipants(threadid: string):
  JQueryPromise<ApiT.ThreadParticipants> {
    var url = prefix + "/api/gmail/thread/participants/"
            + string(Login.myUid())
            + "/" + string(threadid);
    return JsonHttp.get(url);
  }

  export function getThreadParticipantPrefs(threadid: string):
  JQueryPromise<ApiT.TeamPreferencesList> {
    var url = prefix + "/api/gmail/thread/participant/prefs/"
	    + string(Login.myUid())
	    + "/" + string(threadid);
    return JsonHttp.get(url);
  }

  export function getGmailMessage(teamid: string, inboxUid: string,
    gmailMsgId: string): JQueryPromise<ApiT.EmailMessage>
  {
    var url =
      prefix + "/api/gmail/message/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(inboxUid)
      + "/" + string(gmailMsgId);
    return JsonHttp.get(url);
  }

  export function sendEventInvites(teamid: string, fromEmail: string,
    guests: ApiT.Guest[], event: ApiT.CalendarEvent):
  JQueryPromise<void> {
    var url =
      prefix + "/api/event/invite/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(fromEmail);
    var body = { invite_guests: guests, invite_event: event };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getRestrictedDescription(teamid: string, eventid: string,
    guests: ApiT.Guest[]): JQueryPromise<ApiT.EventDescription>
  {
    var url =
      prefix + "/api/event/description/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(eventid);
    var guestEmails =
      _.map(guests, function(g : ApiT.Guest) { return g.email; });
    var body = { emails: guestEmails };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getEventDescriptionWithMessages(description: string,
    messageids: string[]): JQueryPromise<ApiT.EventDescription>
  {
    var url = prefix + "/api/event/description-with-messages/"
            + string(Login.myUid());
    var body = { description: description,
                 description_messageids: messageids };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function updateGoogleEvent(teamid: string,
                                    alias: string,
                                    eventid: string,
                                    event: ApiT.CalendarEventEdit):
  JQueryPromise<void> {
    var url =
        prefix + "/api/event/edit/" + string(Login.myUid())
        + "/" + string(teamid)
        + "/" + encodeURIComponent(alias)
        + "/" + encodeURIComponent(eventid);
    return JsonHttp.post(url, JSON.stringify(event));
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

  export function trackTask(taskid: string, start: number, duration: number):
  JQueryPromise<void> {
    var url =
      prefix + "/api/track/task/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + start.toString()
      + "/" + duration.toString();
    return JsonHttp.put(url, "");
  }

  // Smarter Scheduling:
  // XXX: Disabled until we have time to fix group scheduling.
  export function getGroupEvent(taskid: string):
  JQueryPromise<ApiT.GroupEvent> {
    // var url = prefix + "/api/scheduling/group-event/" + string(taskid);
    // return JsonHttp.get(url);
    Log.assert(false, "Group scheduling is currently disabled.");
    return null;
  }

  // XXX: Disabled until we have time to fix group scheduling.
  export function putGroupEvent(taskid: string, groupEvent: ApiT.GroupEvent):
  JQueryPromise<void> {
    // var url = prefix + "/api/scheduling/group-event/" + string(taskid);
    // return JsonHttp.put(url, JSON.stringify(groupEvent));
    Log.assert(false, "Group scheduling is currently disabled.");
    return null;
  }

  function taskPrefsUrl(taskid: string) {
    return prefix + "/api/scheduling/task-prefs"
      + "/" + string(Login.myUid())
      + "/" + string(taskid);
  }

  export function getTaskPrefs(taskid: string):
  JQueryPromise<ApiT.TaskPreferences> {
    return JsonHttp.get(taskPrefsUrl(taskid));
  }

  export function putTaskPrefs(tpref: ApiT.TaskPreferences):
  JQueryPromise<ApiT.TaskPreferences> {
    return JsonHttp.put(taskPrefsUrl(tpref.taskid), JSON.stringify(tpref));
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

  export function listWorkflows(teamid: string)
    : JQueryPromise<ApiT.UserWorkflows>
  {
    var url =
      prefix + "/api/workflows/list/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function listTemplates(teamid: string)
    : JQueryPromise<ApiT.UserTemplate> {
    var url =
      prefix + "/api/template-list/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putWorkflowProgress(teamid: string, taskid: string,
                                      progress : ApiT.TaskWorkflowProgress)
    : JQueryPromise<void>
  {
    var url =
      prefix + "/api/workflows/progress/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.put(url, JSON.stringify(progress));
  }

  export function deleteWorkflowProgress(teamid: string, taskid: string)
    : JQueryPromise<void>
  {
    var url =
      prefix + "/api/workflows/progress/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.delete_(url);
  }

  /* Team creation */
  export function createTeam(execEmail: string, execName: string)
    : JQueryPromise<ApiT.Team>
  {
    var url = prefix + "/api/team-create/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify({
      executive_email: string(execEmail),
      executive_name: string(execName)
    }));
  }

  export function putTeamCalendars(teamid: string, cals: ApiT.Calendar[])
    : JQueryPromise<ApiT.Team> {
    var url = prefix + "/api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/calendars";
    return JsonHttp.put(url, JSON.stringify({ calendars: cals }));
  }

  /*** Executive Preferences ***/

  /** Sets the preferences given the correct JSON object. */
  export var setPreferences = putPreferences;

  /** Adds workplaces given the correct JSON object. */
  export function addWorkplaces(teamid: string, workplaces: ApiT.Workplace[]):
    JQueryPromise<void>
  {
    var url = prefix + "/api/preferences/workplace/add/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Removes workplaces given the correct JSON object. */
  export function removeWorkplaces(teamid: string,
    workplaces: ApiT.Workplace[]): JQueryPromise<void>
  {
    var url = prefix + "/api/preferences/workplace/remove/" +
      string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Sets workplaces given the correct JSON object. */
  export function setWorkplaces(teamid: string,
    workplaces: ApiT.UserWorkplaces): JQueryPromise<void>
  {
    var url = prefix + "/api/preferences/workplace/change/" +
      string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(workplaces));
  }

  /** Sets transportation given the correct JSON object. */
  export function setTransportation(teamid: string,
    transportation: ApiT.UserTransportation): JQueryPromise<void>
  {
    var url = prefix + "/api/preferences/transportation/" +
      string(Login.me()) + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(transportation));
  }

  /** Sets meeting types given the correct JSON object. */
  export function setMeetingTypes(teamid: string,
      meeting_types: ApiT.MeetingTypes):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/meetings/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(meeting_types));
  }

  /** Sets email types given the correct JSON object. */
  export function setEmailTypes(teamid: string, email_types: ApiT.EmailTypes):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/emails/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, JSON.stringify(email_types));
  }

  /** Sets general prefs given the correct JSON object. */
  export var setGeneralPrefs = setGeneralPreferences;

  /** Sets coworkers given the correct JSON object. */
  export function setCoworkers(teamid: string, coworkers: string):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/coworkers/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, string(coworkers));
  }

  /** Sets notes given the correct JSON object. */
  export function setNotes(teamid: string, notes: string):
    JQueryPromise<void> {
    var url = prefix + "/api/preferences/notes/" + string(Login.me()) + "/" +
      string(teamid);
    return JsonHttp.put(url, string(notes));
  }

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

  /*** Usage tracking ***/

  export function getPeriodList(teamid: string):
    JQueryPromise<ApiT.TaskUsageList> {
    var url = prefix + "/api/usage/period-list/" + string(Login.me())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getUsageEdit(teamid: string,
    periodStart: number):
    JQueryPromise<ApiT.TaskUsage> {
    var url = prefix + "/api/usage/edit/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart);
    return JsonHttp.get(url);
  }

  export function putUsageEdit(tu: ApiT.TaskUsage):
    JQueryPromise<ApiT.TaskUsage> {
    var periodStart = Unixtime.ofRFC3339(tu.start);
    var url = prefix + "/api/usage/edit/" + string(Login.me())
      + "/" + string(tu.teamid)
      + "/" + number(periodStart);
    return JsonHttp.put(url, JSON.stringify(tu));
  }

  export function getUsageExtraCharge(teamid: string,
    periodStart: number,
    revision: number):
    JQueryPromise<ApiT.ExtraCharge> {
    var url = prefix + "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return JsonHttp.get(url);
  }

  export function postUsageExtraCharge(teamid: string,
    periodStart: number,
    revision: number):
    JQueryPromise<void> {
    var url = prefix + "/api/usage/extra-charge/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + number(periodStart)
      + "/" + number(revision);
    return JsonHttp.post(url, "");
  }

  /***/

  export function getSignature(teamid: string, theirUid: string):
    JQueryPromise<ApiT.EmailSignature> {
    var url = prefix + "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return JsonHttp.get(url);
  }

  export function setSignature(teamid: string, theirUid: string,
    sig: ApiT.EmailSignature): JQueryPromise<void>
  {
    var url = prefix + "/api/account/signature/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(theirUid);
    return JsonHttp.put(url, JSON.stringify(sig));
  }

  export function getEventColors():
    JQueryPromise<ApiT.CalendarEventPalette> {
    var url = prefix + "/api/gcal/colors/event/" + string(Login.me());
    return JsonHttp.get(url);
  }

  export function signup(email: string, data: ApiT.Signup):
    JQueryPromise<void> {
    var url = prefix + "/api/signup/" + string(email);
    return JsonHttp.put(url, JSON.stringify(data));
  }

  export function createWorkflow(teamid: string, title: string):
    JQueryPromise<ApiT.Workflow> {
    var url = prefix + "/api/workflows/create/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(title);
    return JsonHttp.post(url, "");
  }

  export function updateWorkflow(teamid: string, workflowid: string,
    workflow: ApiT.Workflow): JQueryPromise<void>
  {
    var url = prefix + "/api/workflows/update/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return JsonHttp.put(url, JSON.stringify(workflow));
  }

  export function deleteWorkflow(teamid: string, workflowid: string):
    JQueryPromise<void>
  {
    var url = prefix + "/api/workflows/delete/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(workflowid);
    return JsonHttp.delete_(url);
  }

  export function createTemplate(teamid: string, title: string):
    JQueryPromise<ApiT.Template> {
    var url = prefix + "/api/template-create/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(title);
    return JsonHttp.post(url, "");
  }

  export function updateTemplate(teamid: string, templateid: string,
    template: ApiT.Template): JQueryPromise<void>
  {
    var url = prefix + "/api/template/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(templateid);
    return JsonHttp.put(url, JSON.stringify(template));
  }

  export function deleteTemplate(teamid: string, templateid: string):
    JQueryPromise<void> {
    var url = prefix + "/api/template/" + string(Login.me())
      + "/" + string(teamid)
      + "/" + string(templateid);
    return JsonHttp.delete_(url);
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
