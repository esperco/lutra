/*
  Additional helpers for using extension messaging (e.g. to comunicate with
  event page)
*/

/// <reference path="./Message.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />

module Esper.Message {

  // Like Message.Message but sans sender (irrelevant since we're posting
  // directly to extension)
  export interface ExtensionMessage {
    type: Type,
    value: any
  }

  // Sends a typed message -- calls from Content Script or Event Page
  export function postToExtension(type: Type, value?: any,
                                  callback?: (response: any) => void) {
    var esperMessage : Message.ExtensionMessage = {
      type: type,
      value: value
    };
    callback = callback || function() {};
    chrome.runtime.sendMessage(esperMessage, callback);
  }

  // Listen for typed message -- call from Event Page -- doesn't seem to
  // work with content script. Can send back response as well.
  export function listenToExtension(type: Type,
      callback: (value: any,
                 sender: chrome.runtime.MessageSender) => any) {
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        var esperMessage: Message.ExtensionMessage = request;
        if (esperMessage && esperMessage.type === type) {
          var ret = callback(esperMessage.value, sender);
          if (! _.isUndefined(ret)) {
            // Wrap with $.when so we can return async functions
            $.when(ret).then(function(r) {
              sendResponse(r)
            }, function(err) {
              sendResponse(err);
            });
            return true;  // Return true to signal to Chrome to keep channel
                          // open for async calls
          }
        }
      });
  }

  // Re-transmit message posted to window to Chrome extension -- call from
  // Content Script
  export function pipeToExtension(type: Type, callback?: (r: any) => void) {
    listen(type, function(value) {
      postToExtension(type, value, callback);
    });
  }
}
