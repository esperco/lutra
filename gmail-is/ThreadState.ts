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

  export function init() {
    // Updates to model get posted to Content Script
    // deltaWrap.addChangeListener(function() {
    //   Message.post(
    //     Message.Type.ThreadStateUserUpdate,
    //     deltaWrap.serialize());
    // });

    // // Update options based on value from posted messages from Content Script
    // Message.listen(Message.Type.ThreadStateStorageUpdate,
    //   function(data: Array<[string, string, ExtensionOptions.SidebarOpts]>) {
    //     deltaWrap.parse(data);
    //   });

    // // Post initial request for data
    // Message.post(Message.Type.RequestThreadState);
  }
}