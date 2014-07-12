module Init {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */
  export var credentials : EsperStorage.Credentials;

  function printCredentialsStatus() {
    if (credentials !== undefined)
      Log.d("We are logged in as " + credentials.googleAccountId + ".");
    else
      Log.d("We are not logged in.");
  }

  /*
    Retrieve UID and API secret from the content script,
    if they're available. The content script first checks if they are available
    in sync storage.

    If not, it will open a browser pop-up
    for Google sign-in that passes login details to the landing page
    app.esper.com.

    The reason for going through the content script is that the oauth
    landing URL cannot be gmail (well, maybe we could use
    https://mail.google.com/mail/u/0/#esper/token/XXXX
    but this solution comes with a bunch of assumptions and possible
    complications).
  */
  function obtainCredentials(callback: (x: EsperStorage.Credentials) => void) {
    var googleAccountId = gmail.get.user_email();
    Log.d("Google account ID: " + googleAccountId);
    //credentials = ...
  }

  function injectLoginControls() {
    Log.d("injectLoginControls()");
  }

  function injectLoggedInControls() {
    Log.d("injectLoggedInControls()");
  }

  function injectEsperControls() {
    printCredentialsStatus();
    if (credentials === undefined)
      injectLoginControls();
    else
      injectLoggedInControls();
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Init.init()");
      alreadyInitialized = true;
      if (credentials === undefined) {
        obtainCredentials(injectEsperControls)
      }
    }
  }
}
