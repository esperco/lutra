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

  function printCredentialsStatus() {
    if (credentials !== undefined)
      Log.d("We are logged in.");
    else
      Log.d("We are not logged in.");
  }

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
      printCredentialsStatus();
      callback();
    });
  }

  /* Wait for the app.esper.com page to post UID and API secret */
  function listenToWindowMessages() {
    var port = chrome.runtime.connect();

    window.addEventListener("message", function(event) {
      Log.d("extension received a message",
            event.origin,
            event.data);
      var data = event.data;
      if ((event.origin === "http://localhost"
           || event.origin === "https://app.esper.com")
          && event.source === window
          && data !== undefined
          && data.sender === "Esper") {
        switch (data.type) {
        case "Credentials":
          storeCredentials(data.value, function() {});
          break;
        case "Logout":
          storeCredentials({}, function() {});
          break;
        }
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
      fetchCredentials(printCredentialsStatus);
      listenToWindowMessages();
      listenToSyncStorageChanges();
    }
  }
}
