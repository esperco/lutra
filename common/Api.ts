module Esper.Api {

  export function echo(serializable) {
    return JsonHttp.post(Conf.Api.url + "/echo",
                         JSON.stringify(serializable));
  }

  export function checkVersion():
  JQueryDeferred<ApiT.ChromeSupport> {
    return JsonHttp.get(Conf.Api.url + "/api/support/chrome/" + Conf.version);
  }

  /* Esper login and password management */

  export function getLoginInfo():
  JQueryDeferred<ApiT.LoginResponse> {
    return JsonHttp.get(Conf.Api.url + "/api/login/" + Login.myUid() + "/info");
  }

  export function getProfile(uid, teamid):
  JQueryDeferred<ApiT.Profile> {
    var url =
      Conf.Api.url + "/api/profile/" + Login.myUid()
      + "/" + uid
      + "/" + teamid;
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
      Conf.Api.url + "/api/thread/details/" + Login.myUid()
      + "/" + threadId;
    return JsonHttp.get(url);
  }

  export function getLinkedThreads(teamid, eventId):
  JQueryDeferred<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + Login.myUid()
      + "/" + teamid
      + "/" + eventId;
    return JsonHttp.get(url);
  }

  export function getLinkedEvents(teamid, threadId,
                                  teamCalendars: ApiT.Calendar[]):
  JQueryDeferred<ApiT.EventWithSyncInfo[]> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId;
    return JsonHttp.post(url, JSON.stringify(cals)).then(function(x) {
      return x.linked_events;
    });
  }

  export function linkEventForMe(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.put(url, "");
  }

  export function linkEventForTeam(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.post(url, "");
  }

  export function unlinkEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function syncEvent(teamid, threadId, calid : string, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + calid
      + "/" + eventId;
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid, threadId, calid, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + calid
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function deleteLinkedEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function eventSearch(teamid, teamCalendars, query):
  JQueryDeferred<ApiT.CalendarEventList> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/search/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(query);
    return JsonHttp.post(url, JSON.stringify(cals));
  }


  export function getEventThreads(teamid, eventId):
  JQueryDeferred<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + Login.myUid()
      + "/" + teamid
      + "/" + eventId;
    return JsonHttp.get(url);
  }

  export function getEventDetails(teamid, calid,
                                  teamCalendars: ApiT.Calendar[], eventid):
  JQueryDeferred<ApiT.CalendarEvent> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/event/details/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(calid)
      + "/" + encodeURIComponent(eventid);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function createEmptyLinkedEvent(teamid, cal: ApiT.Calendar, threadId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/thread/create-linked-event/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(cal.google_cal_id)
      + "/" + threadId;
    return JsonHttp.post(url, "");
  }

  export function createLinkedEvent(teamid, event: ApiT.CalendarEventEdit,
                                    threadId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/thread/put-linked-event/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(event.google_cal_id)
      + "/" + threadId;
    return JsonHttp.post(url, JSON.stringify(event));
  }

  export function getRecentlyCreatedEvents(teamid, teamCalendars):
  JQueryDeferred<ApiT.CreatedCalendarEvents> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/events/" + Login.myUid()
      + "/" + teamid
      + "/recently-created";
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShow(teamCalendars):
  JQueryDeferred<void> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url = Conf.Api.url + "/api/calendar/show/" + Login.myUid();
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShowAll():
  JQueryDeferred<void> {
    var url = Conf.Api.url + "/api/calendar/show-all/" + Login.myUid();
    return JsonHttp.post(url, "");
  }

  export function getPreferences(teamid):
  JQueryDeferred<ApiT.Preferences> {
    var url =
      Conf.Api.url + "/api/preferences/" + Login.myUid()
      + "/" + teamid;
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid, prefs):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/preferences/" + Login.myUid()
      + "/" + teamid;
    return JsonHttp.put(url, JSON.stringify(prefs));
  }

  export function setReminderTime(teamid, from_email, calid, eventid, secs):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/set-reminder-time/" + Login.myUid()
      + "/" + teamid
      + "/" + from_email
      + "/" + calid
      + "/" + eventid
      + "/" + secs;
    return JsonHttp.post(url, "");
  }

  export function unsetReminderTime(eventid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/unset-reminder-time/" + Login.myUid()
      + "/" + eventid;
    return JsonHttp.post(url, "");
  }

  export function getReminders(calid, eventid):
  JQueryDeferred<ApiT.EventReminders> {
    var url =
      Conf.Api.url + "/api/event/reminders/" + Login.myUid()
      + "/" + calid
      + "/" + eventid;
    return JsonHttp.get(url);
  }

  export function enableReminderForGuest(eventid, email,
                                         guest_reminder : ApiT.GuestReminder):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + Login.myUid()
      + "/" + eventid
      + "/" + email;
    return JsonHttp.put(url, JSON.stringify(guest_reminder));
  }

  export function disableReminderForGuest(eventid, email):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + Login.myUid()
      + "/" + eventid
      + "/" + email;
    return JsonHttp.delete_(url);
  }

  export function getDefaultReminder(teamid, calid, eventid):
  JQueryDeferred<ApiT.DefaultReminder> {
    var url =
      Conf.Api.url + "/api/event/default-reminder/" + Login.myUid()
      + "/" + teamid
      + "/" + calid
      + "/" + eventid;
    return JsonHttp.get(url);
  }

  export function postCalendar(teamid, calid,
                               calRequest : ApiT.CalendarRequest):
  JQueryDeferred<ApiT.CalendarEventList> {
    var url =
      Conf.Api.url + "/api/calendar/events/view/" + Login.myUid()
      + "/" + teamid
      + "/" + calid;
    return JsonHttp.post(url, JSON.stringify(calRequest));
  }

  export function obtainTaskForThread(teamid, threadid):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task/" + Login.myUid()
      + "/" + teamid
      + "/" + threadid
      + "?events=true&threads=true";
    return JsonHttp.get(url);
  }

  export function getTaskForThread(teamid, threadid):
  JQueryDeferred<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task-opt/" + Login.myUid()
      + "/" + teamid
      + "/" + threadid
      + "?events=true&threads=true";
    return JsonHttp.get(url).then(function(x) { return x.task; });
  }

  export function deleteTask(taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/task/details/" + Login.myUid()
      + "/" + taskid;
    return JsonHttp.delete_(url);
  }

  export function linkThreadToTask(teamid, threadid, taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + Login.myUid()
      + "/" + teamid
      + "/" + threadid
      + "/" + taskid;
    return JsonHttp.put(url, "");
  }

  export function switchTaskForThread(teamid, threadid,
                                      old_taskid, new_taskid):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + Login.myUid()
      + "/" + teamid
      + "/" + threadid
      + "/" + old_taskid
      + "/" + new_taskid;
    return JsonHttp.put(url, "");
  }

  export function setTaskTitle(taskid, title):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/task/title/" + Login.myUid()
      + "/" + taskid
      + "/" + encodeURIComponent(title);
    return JsonHttp.put(url, "");
  }

  export function searchTasks(teamid, query):
  JQueryDeferred<ApiT.TaskSearchResults> {
    var url =
      Conf.Api.url + "/api/tasks/search/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(query);
    return JsonHttp.get(url);
  }

  export function sendEventInvites(teamid, fromEmail, guests, event):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/event/invite/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(fromEmail);
    var body = { invite_guests: guests, invite_event: event };
    return JsonHttp.post(url, JSON.stringify(body));
  }

}
