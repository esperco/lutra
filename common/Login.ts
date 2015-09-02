module Esper.Login {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */

  function validateAccount(account: Types.Account): boolean {
    return account !== undefined && account.credentials !== undefined;
  }

  export var watchableAccount = new Esper.Watchable.C<Types.Account>(
    validateAccount, undefined
  );

  export var getLoginInfo : JQueryPromise<ApiT.LoginResponse>;

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

  function stringifyAccount(a: Types.Account) {
    if (!a) {
      return undefined;
    }
    else {
      return JSON.stringify(a.credentials);
    }
  }

  function accountEqual(a: Types.Account, b: Types.Account): boolean {
    return (stringifyAccount(a) === stringifyAccount(b));
  }

  export function setAccount(account: Types.Account) {
    var oldAccount = watchableAccount.get();
    if (! accountEqual(oldAccount, account)) {
      watchableAccount.set(account);
    }
  }

  export function printStatus() {
    if (loggedIn()) {
      Log.d("We are logged in as " + myGoogleAccountId() + ".");
    } else {
      Log.d("We are not logged in");
    }
  }

  export function myUid() {
    if (loggedIn()) {
      return getAccount().credentials.uid;
    } else {
      return;
    }
  }

  export function myGoogleAccountId() {
    if (loggedIn()) {
      return getAccount().googleAccountId;
    } else {
      return;
    }
  }

  export function myEmail() {
    if (watchableInfo.get() !== undefined) {
      return watchableInfo.get().email;
    } else {
      return;
    }
  }

  export function myTeams() {
    if (watchableInfo.get() !== undefined) {
      return watchableInfo.get().teams;
    } else {
      return;
    }
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
