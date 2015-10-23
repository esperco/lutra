/// <reference path="./JsonHttp.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Login.ts" />

module Esper.Api {

  export function echo(serializable) {
    return JsonHttp.post(Conf.Api.url + "/echo",
                         JSON.stringify(serializable));
  }

  export function checkVersion():
  JQueryPromise<ApiT.ChromeSupport> {
    return JsonHttp.get(Conf.Api.url + "/api/support/chrome/" + Conf.version);
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

  /* Esper login and password management */

  export function getLoginInfo():
  JQueryPromise<ApiT.LoginResponse> {
    var url = Conf.Api.url + "/api/login/" + string(Login.myUid()) + "/info";
    return JsonHttp.get(url);
  }

  export function getProfile(uid, teamid):
  JQueryPromise<ApiT.Profile> {
    var url =
      Conf.Api.url + "/api/profile/" + string(Login.myUid())
      + "/" + string(uid)
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getAllTeamProfiles():
  JQueryPromise<ApiT.ProfileList> {
    var url =
      Conf.Api.url + "/api/profile/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  function calIds(teamCalendars: ApiT.Calendar[]): string[] {
    return List.map(teamCalendars, function(cal) {
      return cal.google_cal_id;
    });
  }

  export function getThreadDetails(threadId):
  JQueryPromise<ApiT.EmailThread> {
    var url =
      Conf.Api.url + "/api/thread/details/" + string(Login.myUid())
      + "/" + string(threadId);
    return JsonHttp.get(url);
  }

  export function getLinkedThreads(teamid, eventId):
  JQueryPromise<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  export function getLinkedEvents(teamid,
                                  threadId,
                                  teamCalendars: ApiT.Calendar[]):
  JQueryPromise<ApiT.TaskEvent[]> {
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
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function linkEventForTeam(teamid, threadId, eventId):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, "");
  }

  export function unlinkEvent(teamid, threadId, eventId):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function syncEvent(teamid, threadId, calid : string, eventId):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid, threadId, calid, eventId):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(calid)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function deleteLinkedEvent(teamid, threadId, eventId):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.delete_(url);
  }

  export function updateLinkedEvent(teamid, threadId, eventId,
                                    eventEdit: ApiT.CalendarEventEdit):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/event/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadId)
      + "/" + string(eventId);
    return JsonHttp.post(url, JSON.stringify(eventEdit));
  }

  export function eventSearch(teamid, teamCalendars, query):
  JQueryPromise<ApiT.CalendarEventList> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(query);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function eventRange(teamid, teamCalendars,
                             from: number, until: number):
  JQueryPromise<ApiT.CalendarEventList> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/calendar/range/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + from.toString()
      + "/" + until.toString();
    return JsonHttp.post(url, JSON.stringify(cals));
  }


  export function getEventThreads(teamid, eventId):
  JQueryPromise<ApiT.LinkedEmailThreads> {
    var url =
      Conf.Api.url + "/api/event/threads/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(eventId);
    return JsonHttp.get(url);
  }

  export function getEventDetails(teamid, calid,
                                  teamCalendars: ApiT.Calendar[], eventid):
  JQueryPromise<ApiT.CalendarEventOpt> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url =
      Conf.Api.url + "/api/event/details-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(calid))
      + "/" + encodeURIComponent(string(eventid));
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function createTaskLinkedEvent(createdBy, teamid,
                                        event: ApiT.CalendarEventEdit,
                                        taskId):
  JQueryPromise<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/task/put-linked-event/" + string(Login.myUid())
      + "/" + string(createdBy)
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(event.google_cal_id))
      + "/" + string(taskId);
    return JsonHttp.post(url, JSON.stringify(event));
  }

  export function getCalendarList(teamid?: string)
    : JQueryPromise<ApiT.Calendars> {
    var url = Conf.Api.url + "/api/calendar/list/" + string(Login.myUid());
    if (teamid) {
      url += "/" + string(teamid);
    }
    return JsonHttp.get(url);
  }

  export function postCalendarShow(teamid, teamCalendars):
  JQueryPromise<void> {
    var cals = { google_cal_ids: calIds(teamCalendars) };
    var url = Conf.Api.url + "/api/calendar/show/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function postCalendarShowAll():
  JQueryPromise<void> {
    var url = Conf.Api.url + "/api/calendar/show-all/" + string(Login.myUid());
    return JsonHttp.post(url, "");
  }

  export function getAllPreferences():
  JQueryPromise<ApiT.PreferencesList> {
    var url =
      Conf.Api.url + "/api/preferences/" + string(Login.myUid());
    return JsonHttp.get(url);
  }

  export function getPreferences(teamid):
  JQueryPromise<ApiT.Preferences> {
    var url =
      Conf.Api.url + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid, prefs):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/preferences/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.put(url, JSON.stringify(prefs));
  }

  export function setGeneralPreferences(teamid, general_prefs):
  JQueryPromise<void> {
      var url =
          Conf.Api.url + "/api/preferences/general/" + string(Login.myUid())
          + "/" + string(teamid);
      return JsonHttp.put(url, JSON.stringify(general_prefs));
  }

  export function getPreferenceChanges(teamid, from: number, until: number):
  JQueryPromise<ApiT.PreferenceChanges> {
    var url =
      Conf.Api.url + "/api/preferences/changes/" + string(Login.myUid())
      + "/" + string(teamid) + "/" + from.toString() + "/" + until.toString();
    return JsonHttp.get(url);
  }

  /*** Emails ***/
  export function sendAgenda(teams,
                             timezone,
                             time_from: string,
                             time_until: string,
                             html_format,
                             include_task_notes,
                             recipients):
  JQueryPromise<void> {
    var url = Conf.Api.url + "/api/agenda/send/" + string(Login.myUid());
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

  export function agendaRange(teamid,
                              timezone,
                              from: number,
                              until: number):
  JQueryPromise<ApiT.AgendaEventList> {
    var url = Conf.Api.url + "/api/agenda/range/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(timezone))
      + "/" + from.toString()
      + "/" + until.toString();
    return JsonHttp.get(url);
  }

  export function setReminderTime(teamid, from_email, calid, eventid, secs):
  JQueryPromise<void> {
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
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/event/unset-reminder-time/" + string(Login.myUid())
      + "/" + string(eventid);
    return JsonHttp.post(url, "");
  }

  export function getReminders(calid, eventid):
  JQueryPromise<ApiT.EventReminders> {
    var url =
      Conf.Api.url + "/api/event/reminders/" + string(Login.myUid())
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function enableReminderForGuest(eventid, email,
                                         guest_reminder : ApiT.GuestReminder):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.put(url, JSON.stringify(guest_reminder));
  }

  export function disableReminderForGuest(eventid, email):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/event/remind/" + string(Login.myUid())
      + "/" + string(eventid)
      + "/" + string(email);
    return JsonHttp.delete_(url);
  }

  export function getDefaultReminder(teamid, calid, eventid):
  JQueryPromise<ApiT.DefaultReminder> {
    var url =
      Conf.Api.url + "/api/event/default-reminder/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(calid)
      + "/" + string(eventid);
    return JsonHttp.get(url);
  }

  export function postCalendar(teamid, calid,
                               calRequest : ApiT.CalendarRequest):
  JQueryPromise<ApiT.CalendarEventList> {
    var url =
      Conf.Api.url + "/api/calendar/events/view/" + string(Login.myUid())
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
      Conf.Api.url + "/api/event/task/" + string(Login.myUid())
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
      Conf.Api.url + "/api/event/task-list/" + string(Login.myUid())
      + "/" + string(eventid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.tasks; });
  }

  export function obtainTaskForThread(teamid, threadid,
                                      withEvents: boolean,
                                      withThreads: boolean):
  JQueryPromise<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + threadid
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url);
  }

  export function getTaskListForThread(threadid,
                                       withEvents: boolean,
                                       withThreads: boolean):
  JQueryPromise<ApiT.Task[]> {
    var url =
      Conf.Api.url + "/api/thread/task-list/" + string(Login.myUid())
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.tasks; });
  }

  export function getTaskForThread(teamid, threadid,
                                   withEvents: boolean,
                                   withThreads: boolean):
  JQueryPromise<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/thread/task-opt/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "?events=" + withEvents.toString()
      + "&threads=" + withThreads.toString();
    return JsonHttp.get(url).then(function(x) { return x.task; });
  }

  export function getTask(taskid: string,
                          withEvents: boolean,
                          withMessages: boolean): JQueryPromise<ApiT.Task> {
    var url = Conf.Api.url + "/api/task/details/" + string(Login.myUid())
            + "/" + string(taskid)
            + "?events=" + withEvents.toString()
            + "&messages=" + (withMessages ? "id" : "no");
    return JsonHttp.get(url);
  }

  export function archiveTask(taskid):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/task/archive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unarchiveTask(taskid):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/task/unarchive/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function linkThreadToTask(teamid, threadid, taskid):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.put(url, "");
  }

  export function unlinkThreadFromTask(teamid, threadid, taskid):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(taskid);
    return JsonHttp.delete_(url);
  }

  export function switchTaskForThread(teamid, threadid,
                                      old_taskid, new_taskid):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/thread/task/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(threadid)
      + "/" + string(old_taskid)
      + "/" + string(new_taskid);
    return JsonHttp.put(url, "");
  }

  export function setTaskTitle(taskid, title):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/task/title/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + encodeURIComponent(string(title));
    return JsonHttp.put(url, "");
  }

  export function setTaskMeetingType(taskid, mtype):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/task/meeting-type/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + encodeURIComponent(string(mtype));
    return JsonHttp.put(url, "");
  }

  export function setTaskNotes(taskid, notes):
  JQueryPromise<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/task/notes/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, string(notes));
  }

  export function setTaskNotesQuill(taskid, notes):
    JQueryPromise<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/task/notes/quill/" + string(Login.myUid())
      + "/" + string(taskid);
    return JsonHttp.put(url, string(notes));
  }

  export function setTaskProgress(taskid, progress):
  JQueryPromise<ApiT.Task> {
    var url =
      Conf.Api.url + "/api/task/label/progress/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + string(progress);
    return JsonHttp.put(url, "");
  }

  export function setTaskLabels(teamid: string,
                                taskid: string,
                                labels: string[]): JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/task/label/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.post(url, JSON.stringify({labels:labels}));
  }

  export function searchTasks(teamid, query):
  JQueryPromise<ApiT.TaskSearchResults> {
    var url =
      Conf.Api.url + "/api/tasks/search/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(string(query));
    return JsonHttp.get(url);
  }

  export function getTaskPage(url: string):
  JQueryPromise<ApiT.TaskList> {
    return JsonHttp.get(url);
  }

  export function getTaskList(teamid,
                              pageSize: number,
                              withEvents: boolean,
                              withThreads: boolean):
  JQueryPromise<ApiT.TaskList> {
    var url =
      Conf.Api.url + "/api/tasks/page/" + string(Login.myUid())
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
      Conf.Api.url + "/api/tasks/send/" + string(Login.myUid());
    var params = { teams: teams,
                   labels: labels,
                   progress: progress,
                   html_format: html_format,
                   recipients: recipients
                 };
    return JsonHttp.post(url, JSON.stringify(params));
  }

  export function notifyTaskMessage(task, emails, snippet):
  JQueryPromise<void> {
    var url = Conf.Api.url + "/api/gmail/notify/"
            + string(Login.myUid()) + "/"
            + string(task.task_teamid);
    var body = {taskid: task.taskid, emails:emails, snippet:snippet};
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getThreadParticipants(threadid):
  JQueryPromise<ApiT.ThreadParticipants> {
    var url = Conf.Api.url + "/api/gmail/thread/participants/"
            + string(Login.myUid())
            + "/" + string(threadid);
    return JsonHttp.get(url);
  }

  export function getThreadParticipantPrefs(threadid):
  JQueryPromise<ApiT.TeamPreferencesList> {
    var url = Conf.Api.url + "/api/gmail/thread/participant/prefs/"
	    + string(Login.myUid())
	    + "/" + string(threadid);
    return JsonHttp.get(url);
  }

  export function getGmailMessage(teamid, inboxUid, gmailMsgId):
  JQueryPromise<ApiT.EmailMessage> {
    var url =
      Conf.Api.url + "/api/gmail/message/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(inboxUid)
      + "/" + string(gmailMsgId);
    return JsonHttp.get(url);
  }

  export function sendEventInvites(teamid, fromEmail, guests,
                                   event: ApiT.CalendarEvent):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/event/invite/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(fromEmail);
    var body = { invite_guests: guests, invite_event: event };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getRestrictedDescription(teamid, eventid, guests):
  JQueryPromise<ApiT.EventDescription> {
    var url =
      Conf.Api.url + "/api/event/description/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + encodeURIComponent(eventid);
    var guestEmails =
      List.map(guests, function(g : ApiT.Guest) { return g.email; });
    var body = { emails: guestEmails };
    return JsonHttp.post(url, JSON.stringify(body));
  }

  export function getEventDescriptionWithMessages(description, messageids):
  JQueryPromise<ApiT.EventDescription> {
    var url = Conf.Api.url + "/api/event/description-with-messages/"
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
        Conf.Api.url + "/api/event/edit/" + string(Login.myUid())
        + "/" + string(teamid)
        + "/" + encodeURIComponent(alias)
        + "/" + encodeURIComponent(eventid);
    return JsonHttp.post(url, JSON.stringify(event));
  }

  export function getCustomerStatus(teamid):
  JQueryPromise<ApiT.CustomerStatus> {
    var url =
      Conf.Api.url + "/api/pay/status/short/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function getCustomerDetails(teamid):
  JQueryPromise<ApiT.CustomerDetails> {
    var url =
      Conf.Api.url + "/api/pay/status/long/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function trackTask(taskid: string, start: number, duration: number):
  JQueryPromise<void> {
    var url =
      Conf.Api.url + "/api/track/task/" + string(Login.myUid())
      + "/" + string(taskid)
      + "/" + start.toString()
      + "/" + duration.toString();
    return JsonHttp.put(url, "");
  }

  // Smarter Scheduling:
  // XXX: Disabled until we have time to fix group scheduling.
  export function getGroupEvent(taskid: string):
  JQueryPromise<ApiT.GroupEvent> {
    // var url = Conf.Api.url + "/api/scheduling/group-event/" + string(taskid);
    // return JsonHttp.get(url); 
    Log.assert(false, "Group scheduling is currently disabled.");
    return null;
  }

  // XXX: Disabled until we have time to fix group scheduling.
  export function putGroupEvent(taskid: string, groupEvent: ApiT.GroupEvent):
  JQueryPromise<void> {
    // var url = Conf.Api.url + "/api/scheduling/group-event/" + string(taskid);
    // return JsonHttp.put(url, JSON.stringify(groupEvent));
    Log.assert(false, "Group scheduling is currently disabled.");
    return null;
  }

  function taskPrefsUrl(taskid: string) {
    return Conf.Api.url + "/api/scheduling/task-prefs"
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
    var url = Conf.Api.url + "/api/files/" + string(Login.myUid()) + "/"
                                           + string(filename) + "?"
                                           + string(query);

    // Doing a custom request because I'm sending the file directly
    // without using JSON.
    return JsonHttp.httpRequest("PUT", url, contents, "", false);
  }

  export function listWorkflows(teamid)
    : JQueryPromise<ApiT.UserWorkflows>
  {
    var url =
      Conf.Api.url + "/api/workflows/list/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function listTemplates(teamid)
    : JQueryPromise<ApiT.UserTemplate> {
    var url =
      Conf.Api.url + "/api/template-list/" + string(Login.myUid())
      + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putWorkflowProgress(teamid: string, taskid: string,
                                      progress : ApiT.TaskWorkflowProgress)
    : JQueryPromise<void>
  {
    var url =
      Conf.Api.url + "/api/workflows/progress/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.put(url, JSON.stringify(progress));
  }

  export function deleteWorkflowProgress(teamid: string, taskid: string)
    : JQueryPromise<void>
  {
    var url =
      Conf.Api.url + "/api/workflows/progress/" + string(Login.myUid())
      + "/" + string(teamid)
      + "/" + string(taskid);
    return JsonHttp.delete_(url);
  }

  /* Team creation */
  export function createTeam(execEmail: string, execName: string)
    : JQueryPromise<ApiT.Team>
  {
    var url = Conf.Api.url + "/api/team-create/" + string(Login.myUid());
    return JsonHttp.post(url, JSON.stringify({
      executive_email: string(execEmail),
      executive_name: string(execName)
    }));
  }

  export function putTeamCalendars(teamid: string, cals: ApiT.Calendar[])
    : JQueryPromise<ApiT.Team> {
    var url = Conf.Api.url + "/api/team/" + string(Login.myUid())
      + "/" + string(teamid) + "/calendars";
    return JsonHttp.put(url, JSON.stringify({ calendars: cals }));
  }

}
