/*
  API client
*/

var api = (function () {

  var mod = {};

  // HTTP - response body is interpreted as JSON

  function jsonHttp(method, url, body) {

    // Common error handling
    function onError(xhr, textStatus, err) {
      switch (xhr.status) {
      case 401: // Unauthorized - redirect to login screen
        route.login();
        break;
      default:
        var details = {
          code: xhr.status,
          method: method,
          url: url,
          reqBody: body,
          respBody: xhr.responseText
        };
        status.reportError("Please try again later.", details);
      }
    }

    // We return a Deferred object.
    // Use .done(function(result){...}) to access the result.
    // (see jQuery documentation)
    return $.ajax({
      url: url,
      type: method,
      data: body,
      dataType: "json",
      beforeSend: login.setHttpHeaders(url)
    })
      .fail(onError);
  }

  function jsonHttpGET(url) {
    return jsonHttp("GET", url, null);
  }

  function jsonHttpPOST(url, body) {
    return jsonHttp("POST", url, body);
  }

  function jsonHttpPUT(url, body) {
    return jsonHttp("PUT", url, body);
  }

  function jsonHttpDELETE(url) {
    return jsonHttp("DELETE", url, null);
  }

  // API

  mod.login = function(email, password) {
    var login_request = { email: email, password: password };
    return jsonHttpPOST("/api/login", JSON.stringify(login_request));
  }

  function api_profile_prefix() {
    return "/api/profile/" + login.data.uid;
  }

  function api_q_prefix() {
    return "/api/q/" + login.data.uid;
  }

  function api_tasks_prefix() {
    return api_q_prefix() + "/tasks/" + login.data.teams[0].teamid;
  }

  mod.getProfile = function (uid) {
    return jsonHttpGET(api_profile_prefix() + "/" + uid);
  }

  mod.loadTaskQueue = function() {
    return jsonHttpGET(api_tasks_prefix() + "/recent")
      .done(function(data) {
        placeView($("#queue"),
                  viewOfTaskQueue("queue", data.tasks));
      });
  }

  mod.loadTaskArchive = function() {
    return jsonHttpGET(api_tasks_prefix() + "/active")
      .done(function(data) {
        placeView($("#archive"),
                  viewOfTaskQueue("archive", data.tasks));
      });
  }

  mod.deleteRequest = function(qid) {
    return jsonHttpDELETE(api_q_prefix() + "/request/" + qid);
  }

  mod.deleteTask = function(tid) {
    return jsonHttpDELETE(api_q_prefix() + "/task/" + tid);
  }

  mod.createTask = function(task, updated_requests) {
    var updated_task = {task_status      : task.task_status,
                        task_participants: task.task_participants,
                        task_requests    : updated_requests};
    return jsonHttpPOST(
      api_q_prefix() + "/task/create/" + login.data.team.teamid,
      JSON.stringify(updated_task)
    )
      .done(function(data) {
        task.tid               = data.tid;
        task.task_teamid       = data.task_teamid;
        task.task_created      = data.task_created;
        task.task_lastmod      = data.task_lastmod;
        task.task_status       = data.task_status;
        task.task_participants = data.task_participants;
        task.task_requests     = data.task_requests;
      });
  }

  mod.postTask = function(task, updated_requests) {
    var updated_task = {task_status      : task.task_status,
                        task_participants: task.task_participants,
                        task_requests    : updated_requests};
    return jsonHttpPOST(api_q_prefix() + "/task/" + task.tid,
                        JSON.stringify(updated_task))
      .done(function(json) {
        task.tid = json.tid;
        for (var i in json.rids) {
          updated_requests[i].rid = json.rids[i];
        }
      });
  }

  mod.queueRemove = function(task, cont) {
    return jsonHttpPOST(api_q_prefix() + "/queue/" + task.tid + "/remove",
                        "",
                        function(http) { cont(); }
                       );
  }

  return mod;
})();
