/*
  Manually request updates to latest Chrome E
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../common/Message.Chrome.ts" />

module Esper.Update {

  function requestUpdate() {
    var dfd = $.Deferred();
    chrome.runtime.requestUpdateCheck((status, details) => {
      dfd.resolve(status);
      if (status === "update_available") {
        chrome.runtime.reload();
      }
    });
    return dfd.promise();
  }

  export function init() {
    // Listen for requests to manually update
    Message.listenToExtension(
      Message.Type.RequestExtensionUpdate,
      requestUpdate
    );
  }
}
