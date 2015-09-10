// Sync ThreadState with local Chrome profile data

/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../marten/ts/Util.ts" />
/// <reference path="../common/ExtensionOptions.ts" />
/// <reference path="../common/Message.ts" />


module Esper.ThreadState {
  // Store all of our settings under a single key -- NB: this means
  var key = "esper-thread-state";

  // A list of threadId, state pairs
  type ThreadData = Array<[string, ExtensionOptions.SidebarOpts]>;

  /*
    Maximum number of pairs to save -- Sync storage allows maximum of 8,192
    bytes per item (see https://developer.chrome.com/extensions/storage for
    updated cap. Assuming each of our threadData look like this after
    serialization -- ["14fb565f26893195",1] -- then we can probably store
    something like 350 pairs. But set to 100 for now because it's a nice
    round number.

    This number should not exceep the cap (the model's cap) in the
    ThreadState.ts file used by the injected script since the IS can't take
    advantage of the extra stored data. It's OK for it to store less than the
    IS though (i.e. not all state data in the IS gets persisted, only the X
    most recent updates).
  */
  var cap = 100;

  // Helper funciton to determine if two pairs in ThreadData refer to the same
  // object
  function eq(a: [string, ExtensionOptions.SidebarOpts],
              b: [string, ExtensionOptions.SidebarOpts]) {
    return a[0] === b[0];
  }

  /*
    Load first so we can add to list -- note that this may not be race-
    condition safe across multiple browsers. But this should be fine in the
    general case and sidebar persistance isn't super-critical data. If we
    actually start caring about this state, consider storing on our own
    servers rather Google's sync storage.
  */
  export function save(newState: ThreadData, callback?: () => void) {
    load(function(state) {
      _.each(newState, function(pair) {
        Util.pushToCapped(state, pair, cap, eq);
      });

      var data: any = {};
      data[key] = state;
      chrome.storage.sync.set(data, callback);
    });
  }

  export function load(callback: (state: ThreadData) => void) {
    chrome.storage.sync.get(key, function(data) {
      var state = (<ThreadData> (<any> data)[key]);
      callback(state);
    });
  }

  function postData(state: ThreadData) {
    Message.post(Message.Type.ThreadStateData, state);
  }

  // Listen for requests for option data from injected scripts
  function listenForRequest() {
    Message.listen(Message.Type.RequestThreadState, function() {
      load(postData);
    });
  }

  // Listen for new data to save from injected scripts
  function listenForUserUpdate() {
    // Save data from injected script to storage
    Message.listen(Message.Type.ThreadStateUpdate,
      function(state: ThreadData) {
        save(state);
      });
  }

  var initialized = false;

  // Initialize in content script to post option updates
  export function init() {
    if (! initialized) {
      listenForRequest();
      listenForUserUpdate();
      initialized = true;
    }
  }
}