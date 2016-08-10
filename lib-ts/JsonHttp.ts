/*
  Utilities for calling the Esper API -- assumes existence of Login
  module with loggedIn and getApiSecret.

  Assumes CryptoJS
*/

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

  /*
    Used to determine whether an JSON error should be ignored
  */
  function ignoreError(code: number, respBody: string): boolean {
    if (code === 0) {
      return true;
    }
    if (respBody && respBody.indexOf("Please log in with Google") >= 0) {
      return true;
    }
    return false;
  }

  /*
    Error logging helper
  */
  interface AjaxError {
    code: number
    textStatus: string;
    method: string;
    url: string;
    reqBody: any;
    respBody: string;
  }

  function logError(details: AjaxError) {
    if (ignoreError(details.code, details.respBody)) {
      Log.w("Ignored error", details)
    } else {
      let body = details.respBody;
      let errorMsg = body;
      try {
        let err = JSON.parse(body);
        if (isClientError(err)) {
          errorMsg = err.error_message;
        }
      } catch (err) { /* Ignore */ }
      Log.e(`${details.code} ${errorMsg}`, details);
    }
  }

  function isClientError(e: any): e is ApiT.ClientError {
    let typedError = e as ApiT.ClientError;
    return !_.isUndefined(typedError) &&
      !!_.isNumber(typedError.http_status_code) &&
      !!_.isString(typedError.error_message);
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
      ret = ret.fail((xhr: JQueryXHR, textStatus: string) => {
        logError({
          code: xhr.status,
          textStatus: textStatus,
          method: method,
          url: path,
          reqBody: body,
          respBody: xhr.responseText
        });
      });
    }
    return ret;
  }

  /** Executes an HTTP request using our standard authentication and
   *  error handling and a JSON content type.
   */
  function jsonHttp(method: ApiT.HttpMethod,
                    path: string,
                    body?: any) {
    // Batch, don't fire call.
    if (insideBatch) {
      let request: ApiT.HttpRequest<any> = {
        request_method: method,
        request_uri: path
      };
      if (body) {
        request.request_body = body;
      }
      let index = batchQueue.length;
      batchQueue.push(request);
      return batchDfd.promise()
        .then((success) => {
          let response = success.responses[index];
          let status = response && response.response_status;
          if (status && ((status >= 200 && status < 300) || status === 304)) {
            return response.response_body;
          } else {
            logError({
              code: status,
              textStatus: "error",
              method: method,
              url: path,
              reqBody: body,
              respBody: JSON.stringify(response.response_body)
            });
            return $.Deferred().reject({
              status: status,
              responseText: response.response_body
            });
          }
        });
    }

    // Normal, non-batch
    var contentType = body ? "application/json; charset=UTF-8" : "";
    return httpRequest(
      method,
      path,
      JSON.stringify(body),
      "json",
      contentType);
  }

  // Track whether we're inside a batch sequence.
  var insideBatch = false;

  // Queue up batched requests
  var batchQueue: ApiT.HttpRequest<any>[] = [];
  var batchDfd: JQueryDeferred<ApiT.BatchHttpResponses<any>>;

  export function batch(fn: () => void, batchPath: string) {
    var topLevel = !insideBatch;
    if (topLevel) {
      insideBatch = true;
      batchDfd = $.Deferred();
    }

    try {
      fn();
      if (topLevel) {
        insideBatch = false;
        return jsonHttp("POST", batchPath, {
          requests: batchQueue
        }).then(
          (r) => batchDfd.resolve(r),
          (e) => batchDfd.reject(e)
        );
      }
    } finally {
      if (topLevel) {
        insideBatch = false;
        batchQueue = [];
      }
    }
  }

  export function get(path: string) {
    return jsonHttp("GET", path, null);
  }

  export function post(path: string,
                       body?: any) {
    return jsonHttp("POST", path, body);
  }

  export function put(path: string,
                      body?: any) {
    return jsonHttp("PUT", path, body);
  }

  export function delete_(path: string) {
    return jsonHttp("DELETE", path, null);
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
