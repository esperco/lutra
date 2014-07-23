/*
  Synchronized storage used by Esper, controlled by the content script.
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

  export interface EsperStorage {
    accounts: { [googleAccountId: string]: Account; };
  }


  /* The functions below will only work from the Esper content script */

  function save(x: EsperStorage, callback: () => void) {
    chrome.storage.sync.set({esper: x}, function() {
      Log.d("saved esper storage", x);
      callback();
    });
  }

  function load(callback: (x: EsperStorage) => void) {
    chrome.storage.sync.get("esper", function(obj : any) {
      var x : EsperStorage = obj.esper;
      Log.d("got esper storage:", x);
      if (x === undefined)
        x = { accounts: {} };
      else if (x.accounts === undefined)
        x.accounts = {};
      callback(x);
    });
  }

  function update(transform: (x: EsperStorage) => EsperStorage,
                  whenSaved: (y: EsperStorage) => void) {
    load(function(x) {
      var y = transform(x);
      save(y, function() { whenSaved(y); });
    });
  }

  function getAccount(esper: EsperStorage, googleAccountId: string) {
    console.assert(esper.accounts !== undefined);
    return esper.accounts[googleAccountId];
  }

  export function saveCredentials(x: Credentials,
                                  whenDone: () => void) {
    update(function(esper) {
      var k = x.googleAccountId;
      var account = getAccount(esper, k);
      if (account === undefined) {
        account = { credentials: x };
        esper.accounts[k] = account;
      }
      else
        account.credentials = x;
      return esper;
    }, whenDone);
  }

  export function loadCredentials(googleAccountId: string,
                                  whenDone: (Credentials) => void) {
    load(function(esper) {
      var account = getAccount(esper, googleAccountId);
      var credentials: Credentials;
      if (account !== undefined)
        credentials = account.credentials;
      whenDone(credentials);
    });
  }

  export function deleteCredentials(googleAccountId: string,
                                    whenDone: () => void) {
    load(function(esper) {
      if (esper.accounts[googleAccountId] !== undefined)
        delete esper.accounts[googleAccountId];
      save(esper, whenDone);
    });
  }

  export function listenForChange(callback: (oldValue: EsperStorage,
                                             newValue: EsperStorage) => void) {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === "sync") {
        var change = changes["esper"];
        if (change !== undefined) {
          callback(change.oldValue, change.newValue);
        }
      }
    });
  }

  /* Clear all sync storage for the Esper extension */
  export function clearAll(callback: () => void) {
    chrome.storage.sync.clear(callback);
  }
}
