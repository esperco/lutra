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

  function jsonHttpGet(url) {
    return jsonHttp("GET", url, null);
  }

  function jsonHttpPost(url, body) {
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
    return jsonHttpPost("/api/login", JSON.stringify(login_request));
  };

  mod.requestPassword = function(email) {
    var password_request = { email: email };
    return jsonHttpPost("/api/password-request",
                        JSON.stringify(password_request));
  };

  mod.resetPassword = function(uid, token, password) {
    var password_reset = { password: password };
    return jsonHttpPost("/api/password/" + uid + "/" + token,
                        JSON.stringify(password_reset));
  };

  function api_profile_prefix() {
    return "/api/profile/" + login.data.uid;
  }

  function api_q_prefix() {
    return "/api/q/" + login.data.uid;
  }

  function api_tasks_prefix() {
    return api_q_prefix() + "/tasks/" + login.data.teams[0].teamid;
  }

  mod.getProfile = function(uid) {
    return jsonHttpGet(api_profile_prefix() + "/" + uid);
  };

  mod.postProfile = function(prof) {
    var url = api_profile_prefix() + "/" + prof.profile_uid;
    return jsonHttpPost(url, JSON.stringify(prof));
  };

  mod.getProfileByEmail = function(email) {
    return jsonHttpGet(api_profile_prefix() + "/email/"
                       + encodeURIComponent(email));
  };

  mod.loadActiveTasks = function() {
    return jsonHttpGet(api_tasks_prefix() + "/active");
  };

  mod.deleteTask = function(tid) {
    return jsonHttpDELETE(api_q_prefix() + "/task/" + tid);
  };

  mod.createTask = function(task) {
    return jsonHttpPost(
      api_q_prefix() + "/task/create/" + login.data.team.teamid,
      JSON.stringify(task)
    );
  };

  mod.postTask = function(task) {
    var tid = task.tid;
    var taskEdit = {
      task_status      : task.task_status,
      task_participants: task.task_participants,
      task_data        : task.task_data
    };
    return jsonHttpPost(api_q_prefix() + "/task/" + task.tid,
                        JSON.stringify(taskEdit));
  };

  mod.getTask = function(tid) {
    return jsonHttpGet(api_q_prefix() + "/task/" + tid)
  };

  mod.queueRemove = function(task) {
    return jsonHttpPost(api_q_prefix() + "/queue/" + task.tid + "/remove",
                        "");
  };

  /*** Chat ***/

  mod.postChatItem = function(chatItem) {
    var url = api_q_prefix() + "/chat/" + chatItem.chatid + "/item";
    return jsonHttpPost(url, JSON.stringify(chatItem));
  };

  mod.postChatItemRead = function(chatId, itemId) {
    var url = api_q_prefix() + "/chat/" + chatId + "/item/" + itemId + "/read";
    return jsonHttpPost(url, "");
  }

  /*** Scheduling ***/

  function api_s_prefix() {
    return "/api/s/" + login.data.uid;
  };

  mod.getCalendar = function(uid2, optAuthLandingUrl) {
    var url = api_s_prefix() + "/calendar/"
      + login.data.team.teamid + "/" + uid2;
    if (util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  mod.getTimezones = function() {
    var url = api_s_prefix() + "/timezones";
    return jsonHttpGet(url);
  };

  mod.getCoordinates = function(uid, loc) {
    var url = api_s_prefix() + "/geocode/" + encodeURIComponent(loc);
    return jsonHttpGet(url);
  };

  mod.getTimezone = function(uid, lat, lon) {
    var url = api_s_prefix() + "/timezone/" + lat + "/" + lon;
    return jsonHttpGet(url);
  };

  mod.getPlacePredictions = function(uid, loc) {
    var url = api_s_prefix() + "/place/autocomplete/" +
              encodeURIComponent(loc);
    return jsonHttpGet(url);
  };

  mod.postSelectGooglePlace = function(uid, loc, refId) {
    var url = api_s_prefix() + "/place/save/google/" +
              encodeURIComponent(loc) + "/" + encodeURIComponent(refId);
    return jsonHttpPost(url, "");
  };

  mod.postSelectFavoritePlace = function(uid, loc) {
    var url = api_s_prefix() + "/place/save/favorite/" +
              encodeURIComponent(loc);
    return jsonHttpPost(url, "");
  };

  mod.getSuggestions = function(x) {
    var url = api_s_prefix() + "/suggest";
    return jsonHttpPost(url, JSON.stringify(x));
  };

  mod.reserveCalendar = function(tid) {
    var url = api_s_prefix() + "/event/" + tid + "/reserve";
    return jsonHttpPost(url, "");
  };

  mod.getReminderMessage = function() {
    var url = api_s_prefix() + "/reminder/message";
    return jsonHttpGet(url);
  };

  return mod;
})();
