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

  export function getLinkedEvents(teamid, threadId):
  JQueryDeferred<ApiT.LinkedCalendarEvents> {
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId;
    return JsonHttp.get(url);
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

  export function syncEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid, threadId, eventId):
  JQueryDeferred<void> {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
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

  export function eventSearch(teamid, query):
  JQueryDeferred<ApiT.CalendarEventList> {
    var url =
      Conf.Api.url + "/api/calendar/search/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(query);
    return JsonHttp.get(url);
  }

  export function getEventDetails(teamid, eventid):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/event/details/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(eventid);
    return JsonHttp.get(url);
  }

  export function createNewLinkedEvent(teamid, threadId):
  JQueryDeferred<ApiT.CalendarEvent> {
    var url =
      Conf.Api.url + "/api/thread/create-linked-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId;
    return JsonHttp.post(url, "");
  }
}
