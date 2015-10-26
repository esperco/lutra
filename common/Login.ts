/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/Watchable.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../common/Types.ts" />

module Esper.Login {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */

  function validateAccount(account: Types.Account): boolean {
    return account !== undefined && account.credentials !== undefined;
  }

  export var watchableAccount = new Watchable.C<Types.Account>(
    validateAccount, undefined
  );

  /*
    Function that ensures callback is only triggered after we account info.
    If you need login info as well, chain to getLoginInfo's promise.

    Callback will be called each time a new user logs in but only if
    account info is valid.
  */
  export function onLogin(callback: (account: Types.Account) => void) {
    watchableAccount.watch(function(account, valid, oldAccount, oldValid) {
      if (valid) {
        if (!oldValid ||
          oldAccount.credentials.uid !== account.credentials.uid) {
          callback(account);
        }
      }
    });
  }

  /*
    Reference to Deferred that resolves when account has been set to some valid
    This Deferred is reset whenever we log out or the account is set to
    something invalid. This allows us to defer taking certain actions until
    we have some guarantee that we're logged in.
  */
  var _accountDeferred: JQueryDeferred<Types.Account>;
  watchableAccount.watch(function(account, valid, oldAccount, oldValid) {
    if (!_accountDeferred ||
        (!valid && _accountDeferred.state() !== "pending")) {
      _accountDeferred = $.Deferred<Types.Account>();
    }
    if (valid) {
      _accountDeferred.resolve(account);
    }
  });

  // Get a promise from the _accountDeferred
  export function nextLogin(): JQueryPromise<Types.Account> {
    if (! _accountDeferred) {
      _accountDeferred = $.Deferred<Types.Account>();
    }
    return _accountDeferred.promise();
  }

  /*
    Same idea as above, but for loginInfo -- promise resolving guarantees
    login info is set in addition to login account data
  */
  var _loginInfo: JQueryPromise<ApiT.LoginResponse>;
  export function getLoginInfo(): JQueryPromise<ApiT.LoginResponse> {
    if (!_loginInfo) {
      _loginInfo = nextLogin()
        .then(function() {
          return Api.getLoginInfo();
        })
        .then(function(loginInfo) {
          watchableInfo.set(loginInfo);
          return loginInfo;
        });
    }
    return _loginInfo;
  }

  /* set by getLoginInfo upon success */
  export var watchableInfo = new Watchable.C<ApiT.LoginResponse>(
    function(x) { return x !== undefined && x.uid !== undefined; },
    undefined
  );

  export function getAccount() {
    return watchableAccount.get();
  }

  function stringifyAccount(a: Types.Account) {
    if (!a) {
      return undefined;
    }
    else {
      return a.googleAccountId + " " + JSON.stringify(a.credentials);
    }
  }

  function accountEqual(a: Types.Account, b: Types.Account): boolean {
    return (stringifyAccount(a) === stringifyAccount(b));
  }

  export function setAccount(account: Types.Account) {
    var oldAccount = watchableAccount.get();
    if (! accountEqual(oldAccount, account)) {
      watchableAccount.set(account);
      watchableInfo.set(undefined);
      if (account && account.credentials) {
        setCredentials(account.credentials.uid, account.credentials.apiSecret);
        getLoginInfo();
      } else {
        unsetCredentials();
      }
    }
  }

  export function printStatus() {
    if (loggedIn()) {
      Log.d("We are logged in as " + myGoogleAccountId() + ".");
    } else {
      Log.d("We are not logged in");
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
    if (watchableInfo.isValid()) {
      return watchableInfo.get().email;
    } else {
      return;
    }
  }

  export function myTeams() {
    if (watchableInfo.isValid()) {
      return watchableInfo.get().teams;
    } else {
      return;
    }
  }

  /* Send a Logout request. */
  export function logout() {
    _loginInfo = undefined;
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
