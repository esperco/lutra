/*
  API client
*/

var api = (function () {

  var mod = {};

  // HTTP - response body is interpreted as JSON

  function jsonHttp(method, url, body) {

    function logError(xhr, textStatus, err) {
      var details = {
        code: xhr.status,
        textStatus: textStatus,
        method: method,
        url: url,
        reqBody: body,
        respBody: xhr.responseText
      };
      switch (xhr.status) {
      case 400:
        log("Bad request", details);
        break;
      case 401:
        log("Unauthorized", details);
        break;
      case 404:
        log("Not found", details);
        break;
      case 500: /* Server error */
        log("Server error", details);
        break;
      default: /* Fallback */
        log("Unknown error " + xhr.status, details);
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
      .fail(logError);
  }

  function jsonHttpGet(url) {
    return jsonHttp("GET", url, null);
  }

  function jsonHttpPost(url, body) {
    return jsonHttp("POST", url, body);
  }

  function jsonHttpPut(url, body) {
    return jsonHttp("PUT", url, body);
  }

  function jsonHttpDelete(url) {
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
    return jsonHttpPost("/api/password/set/" + uid + "/" + token,
                        JSON.stringify(password_reset));
  };

  mod.changePassword = function(myUID, theirUID, teamid, password) {
    var password_reset = { password: password };
    return jsonHttpPost("/api/password/change/" + myUID + "/" +
                        theirUID + "/" + teamid,
                        JSON.stringify(password_reset));
  };

  function api_profile_prefix() {
    return "/api/profile/" + login.data.uid;
  }

  function api_q_prefix() {
    return "/api/q/" + login.data.uid;
  }

  function api_tasks_prefix() {
    return api_q_prefix() + "/tasks/" + login.getTeam().teamid;
  }

  mod.getProfile = function(uid) {
    return jsonHttpGet(api_profile_prefix() + "/" + uid);
  };

  mod.postProfile = function(prof, teamid) {
    var url = api_profile_prefix() + "/" + prof.profile_uid + "/" + teamid;
    //console.log(teamid.toSource());
    return jsonHttpPost(url, JSON.stringify(prof));
  };

  mod.getProfileByEmail = function(email) {
    return jsonHttpGet(api_profile_prefix() + "/email/"
                       + encodeURIComponent(email));
  };

  function api_account_prefix() {
    return "/api/account/" + login.data.uid;
  }

  mod.getAccount = function(theirUID, teamid) {
    return jsonHttpGet(api_account_prefix() + "/" + theirUID + "/" + teamid);
  };

  mod.postAccount = function(theirUID, teamid, accountEdit) {
    var url = api_account_prefix() + "/" + theirUID + "/" + teamid;
    return jsonHttpPost(url, JSON.stringify(accountEdit));
  };

  mod.loadActiveTasks = function() {
    return jsonHttpGet(api_tasks_prefix() + "/active");
  };

  mod.loadRecentTasks = function() {
    return jsonHttpGet(api_tasks_prefix() + "/recent");
  };

  mod.deleteTask = function(tid) {
    return jsonHttpDelete(api_q_prefix() + "/task/" + tid);
  };

  mod.archiveTask = function(tid) {
     return jsonHttpPost(api_q_prefix() + "/task/" + tid + "/remove", "");
  };

  mod.rankTaskFirst = function(tid) {
     return jsonHttpPost(api_q_prefix() + "/task/" + tid + "/first", "");
  };

  mod.createTask = function(task) {
    return jsonHttpPost(
      api_q_prefix() + "/task/create/" + login.getTeam().teamid,
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

  mod.getChatItem = function(rid) {
    var url = api_q_prefix() + "/chat/whatever/item/" + rid;
    return jsonHttpGet(url);
  };

  mod.postChatItem = function(chatItem) {
    var url = api_q_prefix() + "/chat/" + chatItem.chatid + "/item";
    return jsonHttpPost(url, JSON.stringify(chatItem));
  };

  mod.postChatItemRead = function(chatId, itemId) {
    var url = api_q_prefix() + "/chat/" + chatId + "/item/" + itemId + "/read";
    return jsonHttpPost(url, "");
  };

  /*** Scheduling ***/

  function api_s_prefix() {
    return "/api/s/" + login.data.uid;
  };

  mod.getCalendar = function(uid2, optAuthLandingUrl) {
    var url = api_s_prefix() + "/calendar/"
      + login.getTeam().teamid + "/" + uid2;
    if (util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  mod.getTimezones = function() {
    var url = api_s_prefix() + "/timezones";
    return jsonHttpGet(url);
  };

  mod.getCoordinates = function(loc) {
    var url = api_s_prefix() + "/geocode/" + encodeURIComponent(loc);
    return jsonHttpGet(url);
  };

  mod.getTimezone = function(lat, lon) {
    var url = api_s_prefix() + "/timezone/" + lat + "/" + lon;
    return jsonHttpGet(url);
  };

  mod.getPlacePredictions = function(partial_loc) {
    var url = api_s_prefix() + "/place/autocomplete/" +
              encodeURIComponent(partial_loc);
    return jsonHttpGet(url);
  };

  mod.getPlaceDetails = function(desc, refId) {
    var url = api_s_prefix() + "/place/details/" +
              encodeURIComponent(desc) + "/" +
              encodeURIComponent(refId);
    return jsonHttpGet(url);
  };

  mod.postCreatePlace = function(uid, desc, edit) {
    var url = api_s_prefix() + "/place/create/" +
              encodeURIComponent(desc);
    return jsonHttpPost(url, JSON.stringify(edit));
  };

  mod.postEditPlace = function(uid, placeid, edit) {
    var url = api_s_prefix() + "/place/edit/" +
              encodeURIComponent(placeid);
    return jsonHttpPost(url, JSON.stringify(edit));
  };

  mod.getPlaceList = function(uid) {
    var url = api_s_prefix() + "/place/list/";
    return jsonHttpGet(url);
  };

  mod.postSelectPlace = function(loc) {
    var url = api_s_prefix() + "/place/select/" +
              encodeURIComponent(loc);
    return jsonHttpPost(url, "");
  };

  mod.getSuggestions = function(x) {
    var url = api_s_prefix() + "/suggest";
    return jsonHttpPost(url, JSON.stringify(x));
  };

  mod.reserveCalendar = function(tid, notified) {
    var url = api_s_prefix() + "/event/" + tid + "/reserve";
    return jsonHttpPost(url, JSON.stringify(notified));
  };

  mod.getReminderMessage = function(tid, parameters) {
    var url = api_s_prefix() + "/task/" + tid + "/reminder/message";
    return jsonHttpPost(url, JSON.stringify(parameters));
  };

  return mod;
})();
