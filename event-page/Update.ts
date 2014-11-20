module Esper.Update {
  /*
     Listening to and forwarding the onUpdateAvailable events
     here in the event page because we don't have access to this part
     of the API from the content scripts.
  */

  function sendMessageToAllTabs(
    message: Message.Message,
    responseHandler?: (m: Message.Message) => void
  ) {
    chrome.tabs.query({}, function(tabs) {
      List.iter(tabs, function(tab: chrome.tabs.Tab) {
        if (HostUrl.hasExtension(tab.url)) {
          Log.d("Sending message to tab " + tab.url);
          chrome.tabs.sendMessage(tab.id, message, responseHandler);
        }
      });
    });
  }

  export function sendVersionUpdate(version: string) {
    var message: Message.Message = {
      sender: "Esper",
      type: "UpdateAvailable",
      value: version
    };
    sendMessageToAllTabs(message);
  }

  export function init() {
    // https://developer.chrome.com/extensions/runtime#event-onUpdateAvailable
    chrome.runtime.onUpdateAvailable.addListener(
      function(details: chrome.runtime.UpdateAvailableDetails) {
        sendVersionUpdate(details.version);
      }
    );
  }
}
