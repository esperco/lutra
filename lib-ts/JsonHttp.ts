/*
  Utilities for calling the Esper API -- assumes existence of Login
  module with loggedIn and getApiSecret.

  Assumes CryptoJS
*/

/// <reference path="./Errors.ts" />
/// <reference path="./Log.ts" />
/// <reference path="./Util.ts" />

module Esper.JsonHttp {
  /*
    By default, JQueryPromiseType does not type errors. Let's extend the
    interface to include proper typing for error messages.
  */
  export interface AjaxError {
    code: number
    textStatus: string;
    method: string;
    url: string;
    reqBody: any;
    respBody: string;

    // Additional info populated if error is instance of ApiT.ClientError
    errorMsg?: string;
    errorDetails?: ApiT.ErrorDetails;
  }

  type DoneCallback<T> = JQueryPromiseCallback<T>;
  type ErrorCallback = JQueryPromiseCallback<AjaxError>;

  // JQueryPromise with proper failure typing
  export interface Promise<T> extends JQueryPromise<T> {
    done(...cbs: Array<DoneCallback<T>|DoneCallback<T>[]>): Promise<T>;
    fail(...cbs: Array<ErrorCallback|ErrorCallback[]>): Promise<T>;

    /*
      Handles case where failFilter doesn't change error type, return
      value for .then is therefore another JsonHttp.Promise
    */
    then<U>(doneFilter: (value?: T, ...values: any[]) => U|Promise<U>,
            failFilter?: (err: AjaxError) => AjaxError|void|Promise<U>,
            progressFilter?: (...progression: any[]) => any): Promise<U>;

    /*
      Handles case where failFilter does change error type. We stop making
      inferences about error typing at this point and just return default
      JQueryPromise.
    */
    then<U>(doneFilter: (value?: T, ...values: any[]) => U|Promise<U>,
            failFilter?: (err: AjaxError) => any,
            progressFilter?: (...progression: any[]) => any): JQueryPromise<T>;

    /*
      Handles case where failFilter doesn't change error type, but voids
      return value. So return value for .then is JsonHttp.Promise<void>
    */
    then(doneFilter: (value?: T, ...values: any[]) => void,
         failFilter?: (err: AjaxError) => AjaxError|void|Promise<void>,
         progressFilter?: (...progression: any[]) => any): Promise<void>;
  }


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
  function ignoreError(details: AjaxError): boolean {
    if (details.code === 0) {
      return true;
    }
    return Errors.handle(details.errorDetails, {
      Use_google_oauth: () => true,
      default: () => false
    });
  }

  // Error logging helper
  function logError(details: AjaxError) {
    if (ignoreError(details)) {
      Log.w("Ignored error", details)
    } else {
      let errorMsg = details.errorDetails ?
        Variant.tag(details.errorDetails) : details.respBody;
      Log.e(`${details.code} ${errorMsg}`, details);
    }
  }

  // Populates AjaxError with details from body if applicable
  function getErrorDetails(error: AjaxError): AjaxError {
    try {
      var parsedJson: ApiT.ClientError = JSON.parse(error.respBody);
      if (isClientError(parsedJson)) {
        error.errorMsg = parsedJson.error_message;
        error.errorDetails = parsedJson.error_details;
      }
    } catch (err) { /* Ignore - not JSON response */ }
    return error;
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
                              processData = true): Promise<any> {
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
    var ret: Promise<any> = $.ajax(request).then(
      (success) => success,
      (xhr: JQueryXHR, textStatus: string) => getErrorDetails({
        code: xhr.status,
        textStatus: textStatus,
        method: method,
        url: path,
        reqBody: body,
        respBody: xhr.responseText
      })
    );

    ret.done(function(respBody) {
      var latency = (Date.now() - startTime) / 1000;
      logResponse(method, path, respBody, latency);
    });

    if (! suppressWarnings) {
      ret.fail(logError);
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
            let error = getErrorDetails({
              code: status,
              textStatus: "error",
              method: method,
              url: path,
              reqBody: body,
              respBody: JSON.stringify(response.response_body)
            })
            logError(error);
            return $.Deferred().reject(error);
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
  export function noWarn(callable: () => Promise<any>) {
    suppressWarnings = true;
    let ret = callable();
    suppressWarnings = false;
    return ret;
  }
}
