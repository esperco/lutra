/*
  Utilities for calling the Esper API -- assumes existence of Login
  module with loggedIn and getApiSecret.

  Assumes CryptoJS
*/

/// <reference path="../typings/cryptojs/cryptojs.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="./Log.ts" />
/// <reference path="./Util.ts" />

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

  /* The version needs to be set by the application, e.g. stoat-1.2.3 */
  export var esperVersion: string;

  function setHttpHeaders(path: string) {
    return function(jqXHR: JQueryXHR) {
      if (Login.loggedIn()) {
        var unixTime = Math.round(Date.now()/1000).toString();
        var apiSecret = Login.getApiSecret();
        var signature = sign(unixTime, path, apiSecret);
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);

        if (esperVersion) {
          jqXHR.setRequestHeader("Esper-Version", esperVersion);
        }
      }
    }
  }

  var suppressWarnings = false; //  Toggled with noWarn()

  function truncateText(s: any,
                        maxLength: number): any {
    if (_.isString(s) && s.length > maxLength)
      return s.slice(0, maxLength) + " ...";
    else
      return s;
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
  function httpRequest(method: string,
                       path: string,
                       body: string,
                       dataType: string,
                       contentType: string,
                       processData = true) {
    var id = Util.randomString();

    var contentTypeJQ : any = contentType == "" ? false : contentType;

    function logResponse(method: string,
                         path: string,
                         respBody: string,
                         latency: number) {
      var truncatedBody = truncateText(respBody, 1000);
      Log.d("API response " + id
            + " " + method
            + " " + path
            + " [" + latency + "s]",
            truncatedBody);
    }

    function logError(xhr: JQueryXHR, textStatus: string, err: Error) {
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
      contentType: contentTypeJQ,
      beforeSend: setHttpHeaders(path),
      dataType: dataType // type of the data expected from the server
    };
    Log.d("API request " + id + " " + method + " " + path, request);

    var startTime = Date.now();
    var ret = $.ajax(request)
      .done(function(respBody) {
        var latency = (Date.now() - startTime) / 1000;
        logResponse(method, path, respBody, latency);
      });
    if (! suppressWarnings) {
      ret = ret.fail(logError);
    }
    return ret;
  }

  /** Executes an HTTP request using our standard authentication and
   *  error handling and a JSON content type.
   */
  function jsonHttp(method: string,
                    path: string,
                    body?: string,
                    dataType = "json",
                    contentType?: string) {
    if (!contentType && body && body.length > 0) {
      contentType = "application/json; charset=UTF-8";
    }

    return httpRequest(method, path, body, dataType, contentType);
  }

  export function get(path: string, dataType?: string) {
    return jsonHttp("GET", path, null, dataType);
  }

  export function post(path: string,
                       body?: string,
                       dataType?: string,
                       contentType?: string) {
    return jsonHttp("POST", path, body, dataType, contentType);
  }

  export function put(path: string,
                      body?: string,
                      dataType?: string,
                      contentType?: string) {
    return jsonHttp("PUT", path, body, dataType, contentType);
  }

  export function delete_(path: string, dataType?: string) {
    return jsonHttp("DELETE", path, null, dataType);
  }

  /*
    ["foo=123", "bar=abc"] -> "?foo=123&bar=abc"
    [] -> ""
  */
  export function makeQuery(argArray: string[]) {
    var s = argArray.join("&");
    if (argArray.length > 0) {
      s = "?" + s;
    }
    return s;
  }

  // Calls a function, but API calls within that call don't have the error
  // banner popping up -- use for custom error handling.
  export function noWarn(callable: () => JQueryPromise<any>) {
    suppressWarnings = true;
    let ret = callable();
    suppressWarnings = false;
    return ret;
  }
}
