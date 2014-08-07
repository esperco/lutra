/*
  Synchronized storage used by Esper, controlled by the content script.
*/
module Esper.EsperStorage {
  /*
    This is the minimum we need to make API calls as a logged-in Esper user.
    Other account information (profile, teams) can be retrieved using these.
  */
  export interface Credentials {
    apiSecret: string;       // used for signing, but not sent to the server
    uid: string;             // used by the server to find the API secret
  }

  export interface Account {
    googleAccountId: string;
      /* Google account (email address) tied to the Esper account */
    credentials?: Credentials;
      /* Esper UID and API secret */
    declined: boolean;
      /* user said "no thanks" when asked to log in;
         this field should be set to false
         if credentials exist.
      */
  }

  export interface EsperStorage {
    accounts: { [googleAccountId: string]: Account; };
  }


  /* The functions below will only work from the Esper content script */

  function save(x: EsperStorage, callback: () => void) {
    chrome.storage.sync.set({esper: x}, function() {
      Log.d("Saved esper storage", x);
      callback();
    });
  }

  function load(callback: (x: EsperStorage) => void) {
    chrome.storage.sync.get("esper", function(obj : any) {
      var x : EsperStorage = obj.esper;
      Log.d("Got esper storage:", x);
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

  function newAccount(googleAccountId: string): Account {
    return {
      googleAccountId: googleAccountId,
      declined: false
    };
  }

  function getAccount(esper: EsperStorage, googleAccountId: string) {
    console.assert(esper.accounts !== undefined);
    var account = esper.accounts[googleAccountId];
    if (account === undefined) {
      account = newAccount(googleAccountId);
      esper.accounts[googleAccountId] = account;
    }
    account.googleAccountId = googleAccountId; // compatibility fix 2014-08-04
    Log.d("getAccount returns:", account);
    return account;
  }

  export function saveAccount(x: Account,
                              whenDone: () => void) {
    update(function(esper) {
      var k = x.googleAccountId;
      var account = getAccount(esper, k);
      account.googleAccountId = k;
      if (x.credentials !== undefined)
        account.credentials = x.credentials;
      if (x.declined === true)
        account.declined = true;
      else
        account.declined = false;
      return esper;
    }, whenDone);
  }

  export function loadCredentials(googleAccountId: string,
                                  whenDone: (Account) => void) {
    load(function(esper) {
      var account = getAccount(esper, googleAccountId);
      whenDone(account);
    });
  }

  /* currently: delete the whole Account entry */
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
