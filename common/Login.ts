module Esper.Login {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */

  function validateAccount(account): boolean {
    return account !== undefined && account.credentials !== undefined;
  }

  export var watchableAccount = new Esper.Watchable.C<Types.Account>(
    validateAccount, undefined
  );

  export var getLoginInfo : JQueryDeferred<ApiT.LoginResponse>;
  export var info : ApiT.LoginResponse; // set by getLoginInfo upon success

  export function loggedIn() {
    return watchableAccount.isValid();
  }

  export function getAccount() {
    return watchableAccount.get();
  }

  export function setAccount(account: Types.Account) {
    watchableAccount.set(account);
  }

  export function printStatus() {
    if (loggedIn())
      Log.d("We are logged in as " + myGoogleAccountId() + ".");
    else
      Log.d("We are not logged in");
  }

  export function myUid() {
    if (loggedIn())
      return getAccount().credentials.uid;
    else
      return;
  }

  export function myGoogleAccountId() {
    if (loggedIn())
      return getAccount().googleAccountId;
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
      var googleAccountId = myGoogleAccountId();
      setAccount(undefined);
      var esperMessage = {
        sender: "Esper",
        type: "Logout",
        value: { googleAccountId: googleAccountId }
      };
      Log.d("Logout request:", esperMessage);
      window.postMessage(esperMessage, "*");
    }
  }
}
