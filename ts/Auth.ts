module Auth {
  /*
    The user's API secret is stored using chrome.storage.sync.

    The user logs in once with Esper, then the API secret is
    propagated across all Chrome browsers where the user is logged-in
    as a Google Chrome user.
  */

  /*
    Stored in synchronized storage as JSON.
    This is the minimum we need to make API calls as a logged-in Esper user.
    Other account information (profile, teams) can be retrieved using these.
  */
  export interface Credentials {
    apiSecret: string; // used for signing, but not sent to the server
    uid: string;       // used by the server to find the API secret
  }

  function serializeCredentials(x: Credentials): string {
    return JSON.stringify(x);
  }

  function deserializeCredentials(s: string): Credentials {
    return JSON.parse(s);
  }

  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */
  export var credentials : Credentials;

  /* Fetch UID and API secret from permanent storage, if they're available */
  function fetchCredentials(callback) {
    var s = document.location.href;
    chrome.storage.sync.get("credentials", function(obj : any) {
      credentials = obj.credentials;
      callback(credentials);
    });
  }

  /* Store UID and API secret permanently */
  function storeCredentials(x, callback) : void {
    credentials = x;
    chrome.storage.sync.set({credentials: credentials}, function() {
      callback();
    });
  }

  /* Wait for the app.esper.com page to post UID and API secret */
  function listenToWindowMessages() {
    var port = chrome.runtime.connect();

    window.addEventListener("message", function(event) {
      if ((event.origin === "http://localhost"
           || event.origin === "https://app.esper.com")
          && event.source === window
          && event.data !== undefined
          && event.data.type === "FROM_PAGE") {
        Log.d("Content script received: " + JSON.stringify(event.data));
        // TODO store this.
      }
    }, false);
  }

  /* React to login changes on remote browser sessions */
  function listenToSyncStorageChanges() {
    chrome.storage.onChanged.addListener(function(changes : any, areaName) {
      if (areaName === "sync") {
        var change = changes.credentials;
        if (change !== undefined) {
          credentials = change.newValue;
          if (change.newValue === undefined)
            Log.i("Deleted API secret");
          else
            Log.i("Changed API secret");
        }
      }
    });
  }


  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Auth.init()");
      alreadyInitialized = true;
      listenToWindowMessages();
      listenToSyncStorageChanges();
    }
  }
}
