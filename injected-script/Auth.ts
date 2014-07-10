/*
  Whenever the page is loaded, before executing the code corresponding
  to the URL, the following must be checked:
  - user is logged in;
  - Esper has all the permissions it needs to access the Google services
    on behalf of the user;
  - user is member of at least one complete team (one executive, one assistant)

  The flow is as follows:

  1. user has api_secret (login cookie)?
     - yes: check api_secret validity, go to 2
     - no:
         * display "Google sign-in" button (goes to 2)

  2. server has a valid Google token for all the scopes?
     - yes: go to 3
     - no: request Google permissions and tokens via oauth, go to 3

  3. user is member of at least one team of two members?
     - yes: go to destination
     - no:
         team creation has started?
         - yes: let user add executive or assistant, send or cancel invites;
                then go to destination
         - no: create a team with just one user, go to 'yes'
               (using assistant as temporary executive if needed)

*/

module Auth {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */
  export var credentials : EsperStorage.Credentials;

  function printCredentialsStatus() {
    if (credentials !== undefined)
      Log.d("We are logged in as " + credentials.googleAccountId + ".");
    else
      Log.d("We are not logged in.");
  }

  /* Retrieve UID and API secret from local storage, if they're available */
  function loadCredentials() {
    var googleAccountId = gmail.get.user_email();
    credentials = EsperStorage.loadCredentials(googleAccountId);
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Auth.init()");
      alreadyInitialized = true;
      loadCredentials();
      printCredentialsStatus();
    }
  }
}
