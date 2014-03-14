/*
  API client for guest app
*/

var api = function() {
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
      dataType: "json"
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

  // guest API

  function apiPrefix() {
    var id = /meet\/([^\/]+)\/?$/.exec(location.pathname)[1];
    return "/meet/" + id;
  }

  mod.getTask = function() {
    return jsonHttpGet(apiPrefix() + "/task");
  };

  mod.getChatItem = function(itemId) {
    return jsonHttpGet(apiPrefix() + "/chat/" + itemId);
  };

  mod.postChatItem = function(chatItem) {
    return jsonHttpPost(apiPrefix() + "/chat", JSON.stringify(chatItem));
  };

  mod.postChatItemRead = function(itemId) {
    return jsonHttpPost(apiPrefix() + "/chat/" + itemId + "/read", "");
  };

  mod.getProfile = function(uid) {
    return jsonHttpGet(apiPrefix() + "/profile/" + uid);
  };

  return mod;
}();
