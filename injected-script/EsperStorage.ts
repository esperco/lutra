/*
  Local storage used by Esper within Gmail pages (mail.google.com).
*/
module EsperStorage {
  /*
    This is the minimum we need to make API calls as a logged-in Esper user.
    Other account information (profile, teams) can be retrieved using these.
  */
  export interface Credentials {
    googleAccountId: string; // Google email address tied to the Esper account
    apiSecret: string;       // used for signing, but not sent to the server
    uid: string;             // used by the server to find the API secret
  }

  export interface Account {
    credentials: Credentials
  }

  interface EsperStorage {
    accounts: { [googleAccountId: string]: Account; };
  }

  function save(x: EsperStorage) {
    window.localStorage.setItem("esper", JSON.stringify(x));
  }

  function load(): EsperStorage {
    var s = window.localStorage.getItem("esper");
    var x : EsperStorage;
    if (s === undefined || s === null)
      x = { accounts: {} };
    else
      x = JSON.parse(s);
    if (x.accounts === undefined)
      x.accounts = {};
    return x;
  }

  function update(f: (x: EsperStorage) => EsperStorage) {
    save(f(load()));
  }

  function getAccount(esper: EsperStorage, googleAccountId: string) {
    console.assert(esper.accounts !== undefined);
    return esper.accounts[googleAccountId];
  }

  export function saveCredentials(x: Credentials) {
    update(function(esper) {
      var k = x.googleAccountId;
      var account = getAccount(esper, k);
      if (account === undefined) {
        account = { credentials: x };
        esper[k] = account;
      }
      else
        account.credentials = x;
      return esper;
    });
  }

  export function loadCredentials(googleAccountId: string): Credentials {
    var esper = load();
    var account = getAccount(esper, googleAccountId);
    if (account === undefined)
      return undefined;
    else
      return account.credentials;
  }

  export function deleteCredentials(googleAccountId: string) {
    var esper = load();
    if (esper.accounts[googleAccountId] !== undefined)
      delete esper.accounts[googleAccountId];
    save(esper);
  }
}
