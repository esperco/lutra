module Esper.JsonHttp {
  export function sign(unixTime: string,
                       path: string,
                       apiSecret: string):
  string {
    return CryptoJS.SHA1(
      unixTime
        + ","
        + path
        + ","
        + apiSecret
    ).toString();
  }

  function setHttpHeaders(path) {
    return function(jqXHR) {
      if (Login.loggedIn()) {
        var unixTime = Math.round(Date.now()/1000).toString();
        var apiSecret = Login.getAccount().credentials.apiSecret;
        var signature = sign(unixTime, path, apiSecret);
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);

        jqXHR.setRequestHeader("Esper-Version", "stoat-" + Conf.version);
      }
    }
  }

  function jsonHttp(method, path, body) {

    var id = Util.randomString();

    function logResponse(method: string, path: string, respBody, latency) {
      Log.d("API response " + id
            + " " + method
            + " " + path
            + " [" + latency + "s]",
            respBody);
    }

    function logError(xhr, textStatus, err) {
      var details = {
        code: xhr.status,
        textStatus: textStatus,
        method: method,
        url: path,
        reqBody: body,
        respBody: xhr.responseText
      };
      switch (xhr.status) {
      case 400:
        Log.e("Bad request", details);
        break;
      case 401:
        Log.e("Unauthorized", details);
        break;
      case 404:
        Log.e("Not found", details);
        break;
      case 500: /* Server error */
        Log.e("Server error", details);
        break;
      default: /* Fallback */
        Log.e("Unknown error " + xhr.status, details);
      }
    }

    /*
      We return a Deferred object.
      Use .done(function(result){...}) to access the result.
      (see jQuery documentation)
    */
    var contentType;
    if (body !== undefined && body !== null && body.length > 0) {
      contentType = "application/json; charset=UTF-8";
    }
    var request = {
      url: path,
      type: method,
      data: body,
      dataType: "json",
      contentType: contentType,
      beforeSend: setHttpHeaders(path)
    };
    Log.d("API request " + id + " " + method + " " + path, request);

    var startTime = Date.now();
    return $.ajax(request)
      .fail(logError)
      .done(function(respBody) {
        var latency = (Date.now() - startTime) / 1000;
        logResponse(method, path, respBody, latency);
      });
  }

  export function get(path) {
    return jsonHttp("GET", path, null);
  }

  export function post(path, body) {
    return jsonHttp("POST", path, body);
  }

  export function put(path, body) {
    return jsonHttp("PUT", path, body);
  }

  export function delete_(path) {
    return jsonHttp("DELETE", path, null);
  }

  /*
    ["foo=123", "bar=abc"] -> "?foo=123&bar=abc"
    [] -> ""
  */
  export function makeQuery(argArray) {
    var s = argArray.join("&");
    if (argArray.length > 0)
      s = "?" + s;
    return s;
  }
}
