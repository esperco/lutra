/**
   Cache of task-specific preferences.
*/

module Esper.TaskPreferences {

  var ttl = 300; // 5 min expiration

  function fetch(taskid: string) {
    return Api.getTaskPrefs(taskid);
  }

  var cache =
    new EsperCache.T< JQueryPromise<ApiT.TaskPreferences> >
    (ttl, fetch);

  export function get(taskid: string): JQueryPromise<ApiT.TaskPreferences> {
    return cache.get(taskid);
  }
}
