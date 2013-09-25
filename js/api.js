/*
  API client
*/

var api = (function () {

  var mod = {};

  // HTTP

  function jsonHttp(method, url, body, onError, onSuccess) {
    function error(jqXHR, status, error) {
      switch (status) {
      case 401: // Unauthorized - redirect to login screen
        navigate("/app/login");
        break;
      default:
        var details = {
          code: status.toString(),
          method: method,
          url: url,
          reqBody: body,
          respBody: jqXHR.responseText
        };
        reportError("Please try again later.", details);
        onError();
      }
    }

    $.ajax({
      url: url,
      type: method,
      data: body,
      dataType: "json",
      success: onSuccess,
      beforeSend: login.setHttpHeaders,
      error: error
    });
  }

  function jsonHttpGET(url, cont) {
    jsonHttp("GET", url, null, function(){}, cont);
  }

  function jsonHttpPOST(url, body, cont) {
    jsonHttp("POST", url, body, start, cont);
  }

  function jsonHttpDELETE(url) {
    jsonHttp("DELETE", url, null, start, function(http){});
  }

  // API

  function api_q_prefix() {
    return "/api/q/" + login.data.uid;
  }

  mod.apiLogin = function(email, password, onSuccess) {
    // TODO call the login api
    login.pretendLogin();
    onSuccess();
  }

  mod.loadTaskQueue = function() {
    jsonHttpGET(api_q_prefix() + "/queue", function(data) {
      placeView($("#queue"),
                viewOfTaskQueue("queue", data.queue_elements));
    });
  }

  mod.loadTaskArchive = function() {
    jsonHttpGET(api_q_prefix() + "/archive", function(data) {
      placeView($("#archive"),
                viewOfTaskQueue("archive", data.archive_elements));
    });
  }

  mod.deleteRequest = function(qid) {
    jsonHttpDELETE(api_q_prefix() + "/request/" + qid);
  }

  mod.deleteTask = function(tid) {
    jsonHttpDELETE(api_q_prefix() + "/task/" + tid);
  }

  mod.createTask = function(task, updated_requests) {
    var updated_task = {task_status      : task.task_status,
                        task_participants: task.task_participants,
                        task_requests    : updated_requests};
    jsonHttpPOST(api_q_prefix() + "/task/create/" + login.data.team.teamid,
                 JSON.stringify(updated_task),
                 function(data) {
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
    jsonHttpPOST(api_q_prefix() + "/task/" + task.tid,
                 JSON.stringify(updated_task),
                 function(json) {
                   task.tid = json.tid;
                   for (var i in json.rids) {
                     updated_requests[i].rid = json.rids[i];
                   }
                 });
  }

  mod.queueRemove = function(task, cont) {
    jsonHttpPOST(api_q_prefix() + "/queue/" + task.tid + "/remove",
                 "",
                 function(http) { cont(); }
                );
  }

  return mod;
})();
