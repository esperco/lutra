module Api {

  /* Esper login and password management */

  export function echo(serializable) {
    return JsonHttp.post(Conf.Api.url + "/echo",
                         JSON.stringify(serializable));
  }

  export function getLoginInfo() {
    return JsonHttp.get(Conf.Api.url + "/api/login/" + Login.myUid() + "/info");
  }

  export function getLinkedEvents(teamid, threadId) {
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(Login.myGoogleAccountId())
      + "/" + threadId;
    return JsonHttp.get(url);
  }

  export function putLinkedEvents(teamid, threadId, calEvents) {
    var url =
      Conf.Api.url + "/api/thread/events/" + Login.myUid()
      + "/" + teamid
      + "/" + encodeURIComponent(Login.myGoogleAccountId())
      + "/" + threadId;
    return JsonHttp.put(url, calEvents);
  }

  export function eventSearch(uid, teamid, query) {
    var url =
      Conf.Api.url + "/api/calendar/search/" + uid
      + "/" + teamid
      + "/" + encodeURIComponent(query);
    return JsonHttp.get(url);
  }
}
