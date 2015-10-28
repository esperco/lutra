/*
  Contains code for retrieving login credentials from the store and posting
  to the window -- used to enable shared login credentials between Otter,
  Stoat, and anything else we want to add.

  Refactored into its own file so we can open a barebones version of Otter
  for quick login without any bloat from the rest of the app. Basic system
  works like this:

   (1) The login.html is loaded via an invisible iframe or popup.
   (2) The login.html page posts a message notifying its parent or opener
       that the login.html page is ready.
   (3) Once ready, the parent posts a message to the login page requesting
       credentials.
   (4) If the parent's origin is approved, the login page posts back a message
       containing either credentials or a message that credentials are
       unavailable.

  See Login.iFrame.ts for more details.
*/

/// <reference path="../marten/ts/Log.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="./Store.ts" />

module Esper.Login {

  export interface StoredCredentials {
    uid: string;
    api_secret: string;
    email: string;
  }

  export var storedLoginKey = "login";

  /*
    Retrieve credentials from localStorage -- we only need credentials, not
    the rest of the login_response (which we should refetch on login to
    ensure up-to-date data)
  */
  export function listenAndPost() {
    window.addEventListener("message", function(ev) {
      var data: any = ev.data;
      if (data && data.sender === "Esper" &&
          data.type === "IframeCredentialRequest") {

        // Check if target is authorized
        var match = false;
        for (var i in Conf.authorizedDomains) {
          if (Conf.authorizedDomains[i] === ev.origin) {
            match = true;
            break;
          }
        }
        if (!match) {
          Log.e("Unauthorized domain " + ev.origin);
          return;
        }

        var message = credentialMessage(Store.get(storedLoginKey));
        ev.source.postMessage(message, ev.origin);
      }
    });

    notifyReady();
  };

  export interface EsperMessage {
    sender: string;
    type: string;
    value: any;
  }

  function credentialMessage(x?: StoredCredentials): EsperMessage {
    if (x && x.api_secret && x.uid) {
      return {
        sender: "Esper",
        type: "Account",
        value: {
          googleAccountId: x.email,
          credentials: {
            apiSecret: x.api_secret,
            uid: x.uid
          },
          declined: false
        }
      };
    } else {
      return {
        sender: "Esper",
        type: "NoCredentials",
        value: {}
      }
    }
  }

  /*
    Call to notify parent or opener window that postMessage listener is ready.
    This message isn't very secure and posted to all domains, but the message
    doesn't contain any sensitive information. It exists solely to let parent
    or opener know it is ready to receive login request messages.
  */
  function notifyReady() {
    var windowObj = window.opener || window.parent;
    if (windowObj && windowObj !== window) {
      windowObj.postMessage({
        sender: "Esper",
        type: "LoginReady"
      }, "*");
    }
  }
}
