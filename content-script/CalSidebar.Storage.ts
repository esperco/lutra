/*
  Like ThreadState.Storage.ts, but for the CalSidebar.

  TODO: Refactor against ThreadState.Storage.ts.
*/

/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../marten/ts/Util.ts" />
/// <reference path="../common/ExtensionOptions.ts" />
/// <reference path="../common/Message.ts" />

module Esper.CalSidebar {
  var key = "esper-thread-state";

  type EventSidebarData = Array<[string, ExtensionOptions.SidebarOpts]>;
  var cap = 100;

  // Helper function to determine if two pairs in EventSidebarData refer to the
  // same object
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
  export function save(newState: EventSidebarData, callback?: () => void) {
    load(function(state) {
      _.each(newState, function(pair) {
        Util.pushToCapped(state, pair, cap, eq);
      });

      var data: any = {};
      data[key] = state;
      chrome.storage.sync.set(data, callback);
    });
  }

  export function load(callback: (state: EventSidebarData) => void) {
    chrome.storage.sync.get(key, function(data) {
      var state = (<EventSidebarData>((<any>data)[key] || []));
      callback(state);
    });
  }

  function postData(state: EventSidebarData) {
    Message.post(Message.Type.EventStateData, state);
  }

  // Listen for requests for option data from injected scripts
  function listenForRequest() {
    Message.listen(Message.Type.RequestEventState, function() {
      load(postData);
    });
  }

  // Listen for new data to save from injected scripts
  function listenForUserUpdate() {
    // Save data from injected script to storage
    Message.listen(Message.Type.EventStateUpdate,
      function(state: EventSidebarData) {
        save(state);
      });
  }

  var initialized = false;

  // Initialize in content script to post option updates
  export function init() {
    if (!initialized) {
      listenForRequest();
      listenForUserUpdate();
      initialized = true;
    }
  }
}