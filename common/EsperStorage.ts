/*
  Persistent storage used by Esper, controlled by the content script.
*/
module Esper.EsperStorage {

  /* The functions below will only work from the Esper content script */

  function save(x: Types.Storage, callback: () => void) {
    var stop = Log.start("EsperStorage.save()");
    chrome.storage.local.set({esper: x}, function() {
      callback();
      stop();
    });
  }

  function load(callback: (x: Types.Storage) => void) {
    var stop = Log.start("Types.Storage.load()");
    chrome.storage.local.get("esper", function(obj : any) {
      var x : Types.Storage = obj.esper;
      if (x === undefined)
        x = { accounts: {} };
      else if (x.accounts === undefined)
        x.accounts = {};
      Log.d("Loaded Esper storage:", x);
      callback(x);
      stop();
    });
  }

  function update(transform: (x: Types.Storage) => Types.Storage,
                  whenSaved: (y: Types.Storage) => void) {
    var stop = Log.start("EsperStorage.update()");
    load(function(x) {
      var y = transform(x);
      save(y, function() { whenSaved(y); stop(); });
    });
  }

  function newAccount(googleAccountId: string): Types.Account {
    return {
      googleAccountId: googleAccountId,
      declined: false
    };
  }

  function getAccount(esper: Types.Storage, googleAccountId: string):
  Types.Account {
    console.assert(esper.accounts !== undefined);
    var account = esper.accounts[googleAccountId];
    if (account === undefined) {
      account = newAccount(googleAccountId);
      esper.accounts[googleAccountId] = account;
    }
    account.googleAccountId = googleAccountId; // compatibility fix 2014-08-04
    if (account.activeEvents === undefined)
      account.activeEvents = {
        googleAccountId: googleAccountId,
        calendars: {}
      };
    if (account.activeThreads === undefined)
      account.activeThreads = {
        googleAccountId: googleAccountId,
        threads: []
      };
    Log.d("getAccount returns:", account);
    return account;
  }

  export function saveAccount(x: Types.Account,
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

  export function saveActiveEvents(x: Types.ActiveEvents,
                                   whenDone: () => void) {
    update(function(esper) {
      var k = x.googleAccountId;
      var account = getAccount(esper, k);
      var old = account.activeEvents.calendars;
      var updates = x.calendars;
      for (var cal in updates) {
        if (old[cal] === undefined)
          old[cal] = updates[cal];
        else
          old[cal] = Visited.merge(updates[cal], old[cal], Visited.maxEvents);
      }
      return esper;
    }, whenDone);
  }

  export function saveActiveThreads(x: Types.ActiveThreads,
                                   whenDone: () => void) {
    update(function(esper) {
      var k = x.googleAccountId;
      var account = getAccount(esper, k);
      account.activeThreads.threads =
        Visited.merge(x.threads,
                      account.activeThreads.threads,
                      Visited.maxThreads);
      return esper;
    }, whenDone);
  }

  export function loadCredentials(googleAccountId: string,
                                  whenDone: (account: Types.Account) => void) {
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

  export function listenForChange(callback: (oldValue: Types.Storage,
                                             newValue: Types.Storage) => void) {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === "local") {
        var change = changes["esper"];
        if (change !== undefined) {
          callback(change.oldValue, change.newValue);
        }
      }
    });
  }

  /* Clear all storage for the Esper extension */
  export function clearAll(callback: () => void) {
    var stop = Log.start("clearAll()");
    chrome.storage.local.clear(function() {
      callback();
      stop();
    });
  }
}
