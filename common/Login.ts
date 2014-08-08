module Esper.Login {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */
  export var account : EsperStorage.Account;

  export var info : ApiT.LoginResponse;

  export function loggedIn(): boolean {
    return account !== undefined && account.credentials !== undefined;
  }

  export function printStatus() {
    if (loggedIn())
      Log.d("We are logged in as " + myGoogleAccountId() + ".");
    else
      Log.d("We are not logged in");
  }

  export function myUid() {
    if (loggedIn())
      return account.credentials.uid;
    else
      return;
  }

  export function myGoogleAccountId() {
    if (loggedIn())
      return account.googleAccountId;
    else
      return;
  }

  export function myEmail() {
    if (info !== undefined)
      return info.email;
    else
      return;
  }

  export function myTeams() {
    if (info !== undefined)
      return info.teams;
    else
      return;
  }

  /* Send a Logout request. */
  export function logout() {
    if (loggedIn()) {
      var esperMessage = {
        sender: "Esper",
        type: "Logout",
        value: { googleAccountId: myGoogleAccountId() }
      };
      Log.d("Logout request:", esperMessage);
      window.postMessage(esperMessage, "*");
    }
  }
}
