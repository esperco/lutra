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

  /* set by getLoginInfo upon success */
  export var watchableInfo = new Esper.Watchable.C<ApiT.LoginResponse>(
    function(x) { return x !== undefined && x.uid !== undefined; },
    undefined
  );

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
    if (watchableInfo.get() !== undefined)
      return watchableInfo.get().email;
    else
      return;
  }

  export function myTeams() {
    if (watchableInfo.get() !== undefined)
      return watchableInfo.get().teams;
    else
      return;
  }

  export function hasiOSApp() {
    if (watchableInfo.get() !== undefined)
      return watchableInfo.get().has_ios_app;
    else
      return false;
  }

  /* Send a Logout request. */
  export function logout() {
    getLoginInfo = undefined;
    watchableInfo.set(undefined);
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
