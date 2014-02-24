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
    var request = {
      url: url,
      type: method,
      data: body,
      dataType: "json",
      beforeSend: login.setHttpHeaders(url)
    };
    if (body && body.length > 0) {
      request.contentType = "application/json; charset=UTF-8";
    }
    return $.ajax(request)
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

  function apiProfilePrefix() {
    return "/api/profile/" + login.data.uid;
  }

  function apiQPrefix() {
    return "/api/q/" + login.data.uid;
  }

  function api_tasks_prefix() {
    return apiQPrefix() + "/tasks/" + login.getTeam().teamid;
  }

  mod.getProfile = function(uid) {
    return jsonHttpGet(apiProfilePrefix() + "/" + uid);
  };

  mod.postProfile = function(prof, teamid) {
    var url = apiProfilePrefix() + "/" + prof.profile_uid + "/" + teamid;
    //console.log(teamid.toSource());
    return jsonHttpPost(url, JSON.stringify(prof));
  };

  mod.getProfileByEmail = function(email) {
    return jsonHttpGet(apiProfilePrefix() + "/email/"
                       + encodeURIComponent(email));
  };

  function api_account_prefix() {
    return "/api/account/" + login.data.uid;
  }


  /* Email management */

  mod.getEmails = function(theirUID, teamid) {
    var url = apiQPrefix()  + "/email/" + theirUID + "/" + teamid;
    return jsonHttpGet(url);
  };

  mod.postEmail = function(myUID, theirUID, teamid, email) {
    var url = "/api/q/" + myUID + "/email/" + theirUID + "/" + teamid;
    return jsonHttpPost(url, JSON.stringify(email));
  };

  mod.deleteEmail = function(myUID, theirUID, teamid, email) {
    var url = "/api/q/" + myUID + "/email/" + theirUID + "/" + teamid +
      "/remove";
    return jsonHttpPost(url, JSON.stringify(email));
  };

  mod.resendEmailToken = function(myUID, theirUID, teamid, email) {
    var url = "/api/q/" + myUID + "/email/" + theirUID + "/" + teamid +
      "/resend-token";
    return jsonHttpPost(url, JSON.stringify(email));
  };

  mod.emailVerify = function(uid, email, token) {
    var url = "/api/q/" + uid + "/email-verify/" + encodeURIComponent(token);
    return jsonHttpPost(url, JSON.stringify(email));
  };

  mod.postEmailSignature = function(myUID, theirUID, teamid, sig) {
    var url = "/api/q/" + myUID + "/email/" + theirUID + "/" + teamid +
      "/signature";
    return jsonHttpPost(url, JSON.stringify(sig));
  };

  mod.getContactInfo = function(theirUID, teamid) {
    var url = apiQPrefix() + "/contact/" + theirUID + "/" + teamid;
    return jsonHttpGet(url);
  };

  mod.postContactInfo = function(theirUID, teamid, contact) {
    var url = apiQPrefix() + "/contact/" + theirUID + "/" + teamid;
    return jsonHttpPost(url, JSON.stringify(contact));
  };

  mod.deleteContactInfo = function(theirUID, teamid, contact) {
    var url = apiQPrefix() + "/contact/" + theirUID + "/" + teamid +
      "/remove";
    return jsonHttpPost(url, JSON.stringify(contact));
  };


  mod.loadActiveTasks = function() {
    return jsonHttpGet(api_tasks_prefix() + "/active");
  };

  mod.loadRecentTasks = function() {
    return jsonHttpGet(api_tasks_prefix() + "/recent");
  };

  mod.deleteTask = function(tid) {
    return jsonHttpDelete(apiQPrefix() + "/task/" + tid);
  };

  mod.archiveTask = function(tid) {
     return jsonHttpPost(apiQPrefix() + "/task/" + tid + "/remove", "");
  };

  mod.rankTaskFirst = function(tid) {
     return jsonHttpPost(apiQPrefix() + "/task/" + tid + "/first", "");
  };

  mod.createTask = function(task) {
    return jsonHttpPost(
      apiQPrefix() + "/task/create/" + login.getTeam().teamid,
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
    return jsonHttpPost(apiQPrefix() + "/task/" + task.tid,
                        JSON.stringify(taskEdit));
  };

  mod.getTask = function(tid) {
    return jsonHttpGet(apiQPrefix() + "/task/" + tid)
  };

  mod.queueRemove = function(task) {
    return jsonHttpPost(apiQPrefix() + "/queue/" + task.tid + "/remove",
                        "");
  };

  /*** Chat ***/

  mod.getChatItem = function(rid) {
    var url = apiQPrefix() + "/chat/whatever/item/" + rid;
    return jsonHttpGet(url);
  };

  mod.postChatItem = function(chatItem) {
    var url = apiQPrefix() + "/chat/" + chatItem.chatid + "/item";
    return jsonHttpPost(url, JSON.stringify(chatItem));
  };

  mod.postChatItemRead = function(chatId, itemId) {
    var url = apiQPrefix() + "/chat/" + chatId + "/item/" + itemId + "/read";
    return jsonHttpPost(url, "");
  };

  /*** Scheduling ***/

  function apiSPrefix() {
    return "/api/s/" + login.data.uid;
  };

  mod.getCalendar = function(uid2, optAuthLandingUrl) {
    var url = apiSPrefix() + "/calendar/"
      + login.getTeam().teamid + "/" + uid2;
    if (util.isString(optAuthLandingUrl)) {
      url = url + "?auth_landing=" + encodeURIComponent(optAuthLandingUrl);
    }
    return jsonHttpGet(url);
  };

  mod.postCalendarRevoke = function(uid2) {
    var url = apiSPrefix() + "/calendar/"
      + login.getTeam().teamid + "/" + uid2 + "/revoke";
    return jsonHttpPost(url);
  };

  mod.getTimezones = function() {
    var url = apiSPrefix() + "/timezones";
    return jsonHttpGet(url);
  };

  mod.getCoordinates = function(loc) {
    var url = apiSPrefix() + "/geocode/" + encodeURIComponent(loc);
    return jsonHttpGet(url);
  };

  mod.getTimezone = function(lat, lon) {
    var url = apiSPrefix() + "/timezone/" + lat + "/" + lon;
    return jsonHttpGet(url);
  };

  mod.getPlacePredictions = function(partial_loc) {
    var url = apiSPrefix() + "/place/autocomplete/" +
              encodeURIComponent(partial_loc);
    return jsonHttpGet(url);
  };

  mod.getPlaceDetails = function(desc, refId) {
    var url = apiSPrefix() + "/place/details/" +
              encodeURIComponent(desc) + "/" +
              encodeURIComponent(refId);
    return jsonHttpGet(url);
  };

  mod.postCreatePlace = function(uid, desc, edit) {
    var url = apiSPrefix() + "/place/create/" +
              encodeURIComponent(desc);
    return jsonHttpPost(url, JSON.stringify(edit));
  };

  mod.postEditPlace = function(uid, placeid, edit) {
    var url = apiSPrefix() + "/place/edit/" +
              encodeURIComponent(placeid);
    return jsonHttpPost(url, JSON.stringify(edit));
  };

  mod.deletePlace = function(uid, placeid) {
    var url = apiSPrefix() + "/place/edit/" +
              encodeURIComponent(placeid);
    return jsonHttpDelete(url);
  };

  mod.getPlaceList = function(uid) {
    var url = apiSPrefix() + "/place/list/";
    return jsonHttpGet(url);
  };

  mod.postSelectPlace = function(loc) {
    var url = apiSPrefix() + "/place/select/" +
              encodeURIComponent(loc);
    return jsonHttpPost(url, "");
  };

  mod.getSuggestions = function(x) {
    var url = apiSPrefix() + "/suggest";
    return jsonHttpPost(url, JSON.stringify(x));
  };

  mod.reserveCalendar = function(tid, notified) {
    var url = apiSPrefix() + "/event/" + tid + "/reserve";
    return jsonHttpPost(url, JSON.stringify(notified));
  };

  mod.getGuestAppURL = function(tid, guestUid) {
    var url = apiSPrefix() + "/task/" + tid + "/guestapp/" + guestUid;
    return jsonHttpGet(url);
  }

  mod.getOptionsMessage = function(tid, parameters) {
    var url = apiSPrefix() + "/task/" + tid + "/options/message";
    return jsonHttpPost(url, JSON.stringify(parameters));
  };

  mod.getConfirmationMessage = function(tid, parameters) {
    var url = apiSPrefix() + "/task/" + tid + "/confirmation/message";
    return jsonHttpPost(url, JSON.stringify(parameters));
  };

  mod.getReminderMessage = function(tid, parameters) {
    var url = apiSPrefix() + "/task/" + tid + "/reminder/message";
    return jsonHttpPost(url, JSON.stringify(parameters));
  };

  mod.getUserTemplates = function() {
    var url = "/api/templates/" + login.data.uid;
    return jsonHttpGet(url);
  };

  mod.postUserTemplate = function(uid, template) {
    var url = "/api/templates/" + login.data.uid + "/save";
    return jsonHttpPost(url, JSON.stringify(template));
  };

  return mod;
})();
