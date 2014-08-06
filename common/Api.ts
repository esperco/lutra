module Esper.Api {

  /* Esper login and password management */

  export function echo(serializable) {
    return JsonHttp.post(Conf.Api.url + "/echo",
                         JSON.stringify(serializable));
  }

  export function getLoginInfo() {
    return JsonHttp.get(Conf.Api.url + "/api/login/" + Login.myUid() + "/info");
  }

  export function getGoogleProfile(uid, teamid) {
    var url =
      Conf.Api.url + "/api/google/profile/" + Login.myUid()
      + "/" + uid
      + "/" + teamid;
    return JsonHttp.get(url);
  }

  export function getLinkedEvents(teamid, threadId) {
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId;
    return JsonHttp.get(url);
  }

  export function linkEvent(teamid, threadId, calEvent) {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + calEvent.google_event_id;
    return JsonHttp.put(url, JSON.stringify(calEvent));
  }

  export function unlinkEvent(teamid, threadId, eventId) {
    var url =
      Conf.Api.url + "/api/thread/link-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function syncEvent(teamid, threadId, eventId) {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.put(url, "");
  }

  export function unsyncEvent(teamid, threadId, eventId) {
    var url =
      Conf.Api.url + "/api/thread/sync-event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function deleteLinkedEvent(teamid, threadId, eventId) {
    var url =
      Conf.Api.url + "/api/thread/event/" + Login.myUid()
      + "/" + teamid
      + "/" + threadId
      + "/" + eventId;
    return JsonHttp.delete_(url);
  }

  export function eventSearch(teamid, query) {
    var url =
      Conf.Api.url + "/api/calendar/search/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(query);
    return JsonHttp.get(url);
  }
}
