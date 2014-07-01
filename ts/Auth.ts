module Auth {
  /*
    The user's API secret is stored using chrome.storage.sync.

    The user logs in once with Esper, then the API secret is
    propagated across all Chrome browsers where the user is logged-in
    as a Google Chrome user.
  */

  /* Cached API secret, should be used as long as the API doesn't reject it. */
  export var apiSecret : string;

  /* Fetch API secret from permanent storage, possibly returning undefined */
  function fetchApiSecret(callback) {
    var s = document.location.href;
    chrome.storage.sync.get("apiSecret", function(obj : any) {
      apiSecret = obj.apiSecret;
      callback(apiSecret);
    });
  }

  /* Store API secret permanently */
  function storeApiSecret(s, callback) : void {
    apiSecret = s;
    chrome.storage.sync.set({apiSecret: apiSecret}, function() {
      callback();
    });
  }

  var alreadyInitialized = false;

  /* React to login changes on remote browser sessions */
  export function init() {
    if (! alreadyInitialized) {
      Log.d("Auth.init()");
      alreadyInitialized = true;
      chrome.storage.onChanged.addListener(function(changes : any, areaName) {
        if (areaName === "sync") {
          var change = changes.apiSecret;
          if (change !== undefined) {
            apiSecret = change.newValue;
            if (change.newValue === undefined)
              Log.i("Deleted API secret");
            else
              Log.i("Changed API secret");
          }
        }
      });
    }
  }
}
