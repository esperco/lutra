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

  export function getLinkedEvents(teamid, threadId, teamCalendars):
  JQueryDeferred<ApiT.LinkedCalendarEvents> {
    var cals = { google_cal_ids: teamCalendars };
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId;
    return JsonHttp.post(url, JSON.stringify(cals));
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

  export function syncEvent(teamid, threadId, calid, eventId):
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
    var cals = { google_cal_ids: teamCalendars };
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

  export function getEventDetails(teamid, calid, teamCalendars, eventid):
  JQueryDeferred<ApiT.CalendarEvent> {
    var cals = { google_cal_ids: teamCalendars };
    var url =
      Conf.Api.url + "/api/event/details/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(calid)
      + "/" + encodeURIComponent(eventid);
    return JsonHttp.post(url, JSON.stringify(cals));
  }

  export function createNewLinkedEvent(teamid, calid, threadId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/thread/create-linked-event/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(calid)
      + "/" + threadId;
    return JsonHttp.post(url, "");
  }

  export function getRecentlyCreatedEvents(teamid, teamCalendars):
  JQueryDeferred<ApiT.CreatedCalendarEvents> {
    var cals = { google_cal_ids: teamCalendars };
    var url =
      Conf.Api.url + "/api/calendar/events/" + Login.myUid()
      + "/" + teamid
      + "/recently-created";
    return JsonHttp.post(url, JSON.stringify(cals));
  }
}
