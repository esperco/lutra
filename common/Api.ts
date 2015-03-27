module Esper.Api {

  export function echo(serializable) {
    return JsonHttp.post(Conf.Api.url + "/echo",
                         JSON.stringify(serializable));
  }

  export function checkVersion():
  JQueryDeferred<ApiT.ChromeSupport> {
    return JsonHttp.get(Conf.Api.url + "/api/support/chrome/" + Conf.version);
  }

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.
  */
  function string(x: string) {
    console.assert(x !== undefined && x !== null);
    return x;
  }

  /* Esper login and password management */

  export function getLoginInfo():
  JQueryDeferred<ApiT.LoginResponse> {
    var url = Conf.Api.url + "/api/login/" + string(Login.myUid()) + "/info";
    return JsonHttp.get(url);
  }

  export function getProfile(uid, teamid):
  JQueryDeferred<ApiT.Profile> {
    var url =
      Conf.Api.url + "/api/profile/" + string(Login.myUid())
      + "/" + string(uid)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  function calIds(teamCalendars: ApiT.Calendar[]): string[] {
    return List.map(teamCalendars, function(cal) {
      return cal.google_cal_id;
    });
  }

  export function getThreadDetails(threadId):
  JQueryDeferred<ApiT.EmailThread> {
    var url =
      Conf.Api.url + "/api/thread/details/" + string(Login.myUid())
      + "/" + string(threadId);
    return JsonHttp.get(url);
  }

  export function getLinkedThreads(teamid, eventId):
  JQueryDeferred<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  export function getLinkedEvents(teamid,
                                  threadId,
                                  teamCalendars: ApiT.Calendar[]):
  JQueryDeferred<ApiT.EventWithSyncInfo[]> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/thread/events/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId);
    return JsonHttp.post(url, JSON.stringify(cals)).then(function(x) {
      return x.linked_events;
    });
  }

  export function linkEventForMe(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function linkEventForTeam(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, "");
  }

  export function unlinkEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function syncEvent(teamid, threadId, calid : string, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid, threadId, calid, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function deleteLinkedEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function updateLinkedEvent(teamid, threadId, eventId,
                                    eventEdit: ApiT.CalendarEventEdit):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, JSON.stringify(eventEdit));
  }

  export function eventSearch(teamid, teamCalendars, query):
  JQueryDeferred<ApiT.CalendarEventList> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(query);
    return JsonHttp.post(url, JSON.stringify(cals));
  }


  export function getEventThreads(teamid, eventId):
  JQueryDeferred<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  export function getEventDetails(teamid, calid,
                                  teamCalendars: ApiT.Calendar[], eventid):
  JQueryDeferred<ApiT.CalendarEventOpt> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/event/details-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(calid))
      + "/" + encodeURIComponent(string(eventid));
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function createLinkedEvent(createdBy, teamid,
                                    event: ApiT.CalendarEventEdit,
                                    threadId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/thread/put-linked-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(event.google_cal_id))
      + "/" + string(threadId);
    return JsonHttp.post(url, JSON.stringify(event));
  }

  export function createTaskLinkedEvent(createdBy, teamid,
                                        event: ApiT.CalendarEventEdit,
                                        taskId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/task/put-linked-event/" + string(Login.myUid())
      + "/" + string(createdBy)
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(event.google_cal_id))
      + "/" + string(taskId);
    return JsonHttp.post(url, JSON.stringify(event));
  }

  export function getRecentlyCreatedEvents(teamid, teamCalendars):
  JQueryDeferred<ApiT.CreatedCalendarEvents> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/events/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/recently-created";
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShow(teamCalendars):
  JQueryDeferred<void> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url = Conf.Api.url + "/api/calendar/show/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShowAll():
  JQueryDeferred<void> {
    var url = Conf.Api.url + "/api/calendar/show-all/" + string(Login.myUid());
    return JsonHttp.post(url, "");
  }

  export function getPreferences(teamid):
  JQueryDeferred<ApiT.Preferences> {
    var url =
      Conf.Api.url + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid, prefs):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(prefs));
  }

  export function setReminderTime(teamid, from_email, calid, eventid, secs):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/set-reminder-time/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(from_email)
      + "/" + string(calid)
      + "/" + string(eventid)
      + "/" + secs.toString();
    return JsonHttp.post(url, "");
  }

  export function unsetReminderTime(eventid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/unset-reminder-time/" + string(Login.myUid())
      + "/" + string(eventid);
    return JsonHttp.post(url, "");
  }

  export function getReminders(calid, eventid):
  JQueryDeferred<ApiT.EventReminders> {
    var url =
      Conf.Api.url + "/api/event/reminders/" + string(Login.myUid())
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function enableReminderForGuest(eventid, email,
                                         guest_reminder : ApiT.GuestReminder):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.put(url, JSON.stringify(guest_reminder));
  }

  export function disableReminderForGuest(eventid, email):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.delete_(url);
  }

  export function getDefaultReminder(teamid, calid, eventid):
  JQueryDeferred<ApiT.DefaultReminder> {
    var url =
      Conf.Api.url + "/api/event/default-reminder/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function postCalendar(teamid, calid,
                               calRequest : ApiT.CalendarRequest):
  JQueryDeferred<ApiT.CalendarEventList> {
    var url =
      Conf.Api.url + "/api/calendar/events/view/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid);
    return JsonHttp.post(url, JSON.stringify(calRequest));
  }

  export function obtainTaskForThread(teamid, threadid,
                                      withEvents: boolean,
                                      withThreads: boolean):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + threadid
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url);
  }

  export function getTaskForThread(teamid, threadid,
                                   withEvents: boolean,
                                   withThreads: boolean):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.task; });
  }

  export function getAutoTaskForThread(teamid, threadid,
                                       withEvents: boolean,
                                       withThreads: boolean):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task-auto/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.task; });
  }

  export function archiveTask(taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/task/archive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unarchiveTask(taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/task/unarchive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function linkThreadToTask(teamid, threadid, taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unlinkThreadFromTask(teamid, threadid, taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.delete_(url);
  }

  export function switchTaskForThread(teamid, threadid,
                                      old_taskid, new_taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(old_taskid)
      + "/" + string(new_taskid);
    return JsonHttp.put(url, "");
  }

  export function setTaskTitle(taskid, title):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/task/title/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + encodeURIComponent(string(title));
    return JsonHttp.put(url, "");
  }

  export function setTaskStatus(taskid, status):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/task/status/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + string(status);
    return JsonHttp.put(url, "");
  }

  export function setTaskProgress(taskid, progress):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/task/label/progress/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + string(progress);
    return JsonHttp.put(url, "");
  }

  export function searchTasks(teamid, query):
  JQueryDeferred<ApiT.TaskSearchResults> {
    var url =
      Conf.Api.url + "/api/tasks/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(query));
    return JsonHttp.get(url);
  }

  export function getTaskPage(url: string):
  JQueryDeferred<ApiT.TaskList> {
    return JsonHttp.get(url);
  }

  export function getTaskList(teamid,
                              pageSize: number,
                              withEvents: boolean,
                              withThreads: boolean):
  JQueryDeferred<ApiT.TaskList> {
    var url =
      Conf.Api.url + "/api/tasks/page/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + pageSize.toString()
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return getTaskPage(url);
  }

  export function sendEventInvites(teamid, fromEmail, guests, event: ApiT.CalendarEvent):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/invite/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(fromEmail);
    var body = { invite_guests: guests, invite_event: event };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getRestrictedDescription(teamid, eventid, guests):
  JQueryDeferred<ApiT.EventDescription> {
    var url =
      Conf.Api.url + "/api/event/description/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(eventid);
    var guestEmails =
      List.map(guests, function(g : ApiT.Guest) { return g.email; });
    var body = { emails: guestEmails };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getCustomerStatus(teamid):
  JQueryDeferred<ApiT.CustomerStatus> {
    var url =
      Conf.Api.url + "/api/pay/status/short/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getCustomerDetails(teamid):
  JQueryDeferred<ApiT.CustomerDetails> {
    var url =
      Conf.Api.url + "/api/pay/status/long/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function trackTask(taskid: string, start: number, duration: number):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/track/task/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + start.toString()
      + "/" + duration.toString();
    return JsonHttp.put(url, "");
  }

  // Smarter Scheduling:
  export function getGroupEvent(taskid: string): JQueryDeferred<ApiT.GroupEvent> {
    var url = Conf.Api.url + "/api/scheduling/group-event/" + string(taskid);
    return JsonHttp.get(url);
  }

  export function putGroupEvent(taskid: string, groupEvent: ApiT.GroupEvent):
  JQueryDeferred<void> {
    var url = Conf.Api.url + "/api/scheduling/group-event/" + string(taskid);
    return JsonHttp.put(url, JSON.stringify(groupEvent));
  }
}
