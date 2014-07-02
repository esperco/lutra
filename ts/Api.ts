module Api {
  function setHttpHeaders(path) {
    return function(jqXHR) {
      if (Auth.credentials !== undefined) {
        var unixTime = Math.round(+new Date()/1000).toString();
        var signature = CryptoJS.SHA1(
          unixTime
            + ","
            + path
            + ","
            + Auth.credentials.apiSecret
        );
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);
      }
    }
  }

  function jsonHttp(method, path, body) {

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
    if (body !== undefined && body.length > 0) {
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
    return $.ajax(request)
      .fail(logError);
  }

  function jsonHttpGet(path) {
    return jsonHttp("GET", path, null);
  }

  function jsonHttpPost(path, body) {
    return jsonHttp("POST", path, body);
  }

  function jsonHttpPut(path, body) {
    return jsonHttp("PUT", path, body);
  }

  function jsonHttpDelete(path) {
    return jsonHttp("DELETE", path, null);
  }

  /*
    ["foo=123", "bar=abc"] -> "?foo=123&bar=abc"
    [] -> ""
  */
  function makeQuery(argArray) {
    var s = argArray.join("&");
    if (argArray.length > 0)
      s = "?" + s;
    return s;
  }


  /********************************* API ***************************/


  /* Esper login and password management */

  export function getLoginInfo() {
    return jsonHttpGet("/api/login/" + Login.myUid() + "/info");
  }

}
