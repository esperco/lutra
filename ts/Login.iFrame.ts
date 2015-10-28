/*
  Module with code for logging into app.esper.com via an invisible iFrame
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Api.ts" />

module Esper.Login {
  var iframeLoginDfd: JQueryDeferred<Credentials>;
  var eventListenerReady = false;

  export function loginViaIframe() {
    initEventListener();

    // Don't login again if existing pending promise
    if (!iframeLoginDfd || iframeLoginDfd.state() !== "pending") {
      iframeLoginDfd = $.Deferred();

      // Init frame
      var src = Api.prefix + "/assets/html/login.html";
      var frame = $(`<iframe src="${src}" style="display:none;" />`);
      $("body").append(frame);

      // Clean up frame when done
      iframeLoginDfd.always(function() {
        frame.remove();
      });
    }

    return iframeLoginDfd.promise();
  }

  function initEventListener() {
    if (! eventListenerReady) {
      window.addEventListener("message", function(ev) {
        console.info(ev);

        // Only listen to API host Esper messages
        if (ev.origin === Api.prefix && ev.data &&
          ev.data.sender === "Esper") {

          // We have credentials from iframe, do something with them
          if (ev.data.type === "Account") {
            var credentials = ev.data.value.credentials;
            if (credentials && credentials.uid && credentials.apiSecret) {
              setCredentials(credentials.uid, credentials.apiSecret);
              iframeLoginDfd.resolve(ev.data.value.credentials);
            } else {
              iframeLoginDfd.fail();
            }
          }

          // No credentials
          else if (ev.data.type === "NoCredentials") {
            iframeLoginDfd.fail();
          }

          // iFrame ready => post request
          else if (ev.data.type === "LoginReady") {
            ev.source.postMessage({
              sender: "Esper",
              type: "IframeCredentialRequest"
            }, ev.origin);
          }
        }
      });
    }
    eventListenerReady = true;
  }
}