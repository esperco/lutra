/*
  This is a Chrome event page (non-persistent background page).
  It's not a web page, only a javascript script without an html document.
  At most one instance is running for all tabs. The reason to use that is
  to have access to the full chrome.runtime API, which for some unknown
  reasons is not accessible from the content scripts.

    https://developer.chrome.com/extensions/event_pages
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../marten/typings/cryptojs/cryptojs.d.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/Conf.ts" />
/// <reference path="../common/List.ts" />
/// <reference path="../common/Util.ts" />
/// <reference path="../common/Log.ts" />
/// <reference path="../common/LRU.ts" />
/// <reference path="../common/Visited.ts" />
/// <reference path="../common/EsperStorage.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Message.Chrome.ts" />

/// <reference path="./Update.ts" />
module Esper.Main {

  export function init() : void {
    Log.tag = "Esper [EP]";
    Log.d("Initializing event page");
    Update.init();

    // Handle calls to open option page (for some reason this is event page
    // only call)
    Message.listenToExtension(Message.Type.OpenExtensionOptions, function() {
      chrome.runtime.openOptionsPage();
    });

    // Handle requests from ContentScript to focus on itself
    Message.listenToExtension(Message.Type.FocusOnSender,
      function(data, sender) {
        chrome.windows.update(sender.tab.windowId, { drawAttention: true });
        chrome.tabs.update(sender.tab.id, { active: true });
      });
  }
}

/* Called once */
Esper.Main.init();
