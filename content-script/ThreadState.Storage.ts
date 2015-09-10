// Sync ThreadState with local Chrome profile data

/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../common/ExtensionOptions.ts" />
/// <reference path="../common/Message.ts" />

module Esper.ThreadState {
  // Store all of our settings under a single key -- NB: this means
  var key = "esper-thread-state";

  type DeltaState = Array<[string, string, ExtensionOptions.SidebarOpts]>;

  export function save(state: DeltaState, callback?: () => void) {
    var data: any = {};
    data[key] = state;
    chrome.storage.sync.set(data, callback);
  }

  export function load(callback: (state: DeltaState) => void) {
    chrome.storage.sync.get(key, function(data) {
      var state = (<DeltaState> (<any> data)[key]);
      callback(state);
    });
  }

  function postUpdate(state: DeltaState) {
    Message.post(Message.Type.ThreadStateStorageUpdate, state);
  }

  // Listen for changes to chrome storage and send response on change
  function listenForChange() {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === "sync") {
        var change = (<any> changes)[key];
        if (change) {
          postUpdate(change.newValue);
        }
      }
    });
  }

  // Listen for requests for option data from injected scripts
  function listenForRequest() {
    Message.listen(Message.Type.RequestThreadState, function() {
      load(postUpdate);
    });
  }

  function listenForUserUpdate() {
    // Save data from injected script to storage
    Message.listen(Message.Type.ThreadStateUserUpdate,
      function(state: DeltaState) {
        save(state);
      });
  }

  var initialized = false;

  // Initialize in content script to post option updates
  export function init() {
    // if (! initialized) {
    //   listenForChange();
    //   listenForRequest();
    //   listenForUserUpdate();
    //   initialized = true;
    // }
  }
}