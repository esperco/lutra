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
    chrome.runtime.sendMessage(esperMessage, callback);
  }

  // Listen for typed message -- call from Content Script or Event Page
  export function listenToExtension(type: Type, callback: (value: any)=>void) {
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        var esperMessage: Message.ExtensionMessage = request;
        if (esperMessage && esperMessage.type === type) {
          callback(esperMessage.value);
        }
      });
  }

  // Re-transmit message posted to window to Chrome extension -- call from
  // Content Script
  export function pipeToExtension(type: Type, callback?: (r: any) => void) {
    listen(type, function(value) {
      postToExtension(type, callback);
    });
  }
}
