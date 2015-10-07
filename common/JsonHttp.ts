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

  /** Executes an http request using our standard authentication,
   *  logging and error handling. Can have a custom (ie non-JSON)
   *  content type.
   *
   *  contentType can be "" if the request should not have a
   *  Content-Type header at all. (This is translated to jQuery as
   *  `false', which it supports since 1.5.)
   *
   *  processData controls whether the body is converted to a query
   *  string. It is true by default.
   */
  export function httpRequest(method: string,
                       path: string,
                       body: string,
                       contentType: string,
                       processData = true) {
    var id = Util.randomString();

    var contentTypeJQ : any = contentType == "" ? false : contentType;

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
    var request = {
      url: path,
      type: method,
      data: body,
      dataType: "json",
      contentType: contentTypeJQ,
      beforeSend: setHttpHeaders(path)
    };
    Log.d("API request " + id + " " + method + " " + path, request);

    var startTime = Date.now();
    var apiPromise = $.ajax(request);
    apiPromise
      .fail(logError)
      .done(function(respBody) {
        var latency = (Date.now() - startTime) / 1000;
        logResponse(method, path, respBody, latency);
      });
    return apiPromise;
  }

  /** Executes an HTTP request using our standard authentication and
   *  error handling and a JSON content type.
   */
  function jsonHttp(method, path, body) {
    var contentType;
    if (body !== undefined && body !== null && body.length > 0) {
      contentType = "application/json; charset=UTF-8";
    }

    return httpRequest(method, path, body, contentType);
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
    if (argArray.length > 0) {
      s = "?" + s;
    }
    return s;
  }
}
