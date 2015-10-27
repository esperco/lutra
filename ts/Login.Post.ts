/*
  Contains code for retrieving login credentials from the store and posting
  to the window -- used to enable shared login credentials between Otter,
  Stoat, and anything else we want to add.

  Refactored into its own file so we can open a barebones version of Otter
  for quick login without any bloat from the rest of the app.
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
    ensure up-to-date data).
  */
  export function initAndPost() {
    var stored: StoredCredentials = Store.get(storedLoginKey);
    postCredentials(stored);
  };

  /* Pass UID and API secret to the Esper extension */
  export function postCredentials(x: StoredCredentials) {
    Log.d("postCredentials:", x);
    if (x && x.api_secret && x.uid) {
      var esperMessage = {
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
      Log.d("esperMessage:", esperMessage);

      Log.d("sending message using window.postMessage");

      // Post only to same domain (this is readable by the Chrome Extension
      // but not by a hostile iFrame)
      var target = window.location.protocol + "//" + window.location.host;
      window.postMessage(esperMessage, target);
    }
  }
}