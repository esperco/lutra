/*
  Track sidebar visibility for each thread
*/

/// <reference path="../common/ExtensionOptions.Model.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />
/// <reference path="./CurrentThread.ts" />

module Esper.ThreadState {

  // Total cap on threadState data. Note that there is a 8192 byte limit on
  // sync-able threadState. Cap should reflect this.
  var cap = 100;

  // K/V map from threadId to whether or not to show the sidebar
  export var store =
     new Model.CappedStore<ExtensionOptions.SidebarOpts>(cap);

  // A list of threadId, state pairs
  type ThreadData = Array<[string, ExtensionOptions.SidebarOpts]>;

  // Promise that resolves when initial thread state is loaded
  var loadDeferred = $.Deferred();
  export var loaded = loadDeferred.promise();

  // Var we can toggle to keep listener from posting changes to Content Script
  var quiet = false;

  // Change listener that posts thread state to Content Script
  var storeChanges = function(_ids: string[]) {
    if (!quiet) {
      Message.post(Message.Type.ThreadStateUpdate, _.map(_ids, function(_id) {
        return [_id, store.val(_id)];
      }));
    }
  };

  export function init() {
    // Add our post-to-CS listener
    store.addChangeListener(storeChanges);

    // Update options based on value from posted messages from Content Script
    Message.listen(Message.Type.ThreadStateData, function(data: ThreadData) {
      if (loadDeferred.state() === "pending") {
        loadDeferred.resolve();
      }

      // Silence listener while initializing
      quiet = true;

      _.each(data, function(datum) {
        var _id = datum[0];
        var state = datum[1];
        if (!store.has(_id)) { // Don't override existing local state
          store.insert(_id, state);
        }
      });

      quiet = false;
    });

    // Post initial request for data (response handled by listener above)
    Message.post(Message.Type.RequestThreadState);
  }
}