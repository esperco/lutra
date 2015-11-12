/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../marten/typings/cryptojs/cryptojs.d.ts" />
/// <reference path="../marten/typings/quill/quill.d.ts" />

/// <reference path="../marten/ts/Log.ts" />

/// <reference path="../common/Analytics.ts" />
/// <reference path="../common/Esper.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Conf.ts" />
/// <reference path="../common/List.ts" />
/// <reference path="../common/Util.ts" />
/// <reference path="../common/LRU.ts" />
/// <reference path="../common/Visited.ts" />
/// <reference path="../common/EsperStorage.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Message.Chrome.ts" />
/// <reference path="../common/ExtensionOptions.ts" />
/// <reference path="../common/ExtensionOptions.Storage.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />

/// <reference path="./Update.ts" />
/// <reference path="./Auth.ts" />
/// <reference path="./Location.ts" />
/// <reference path="./ThreadState.Storage.ts" />
/// <reference path="./CalSidebar.Storage.ts" />


module Esper.Main {
  function injectScript(scriptName) {
    Log.d("Injecting script " + scriptName);
    var rootUrl = chrome.extension.getURL("");
    var cssUrl = chrome.extension.getURL("css/esper.css");
    var scriptUrl = chrome.extension.getURL("js/" + scriptName);
    var vendorScriptUrl = chrome.extension.getURL("js/vendor.js");
    var docHead = $("head");
    $("<link rel='stylesheet' type='text/css'/>")
      .attr("href", cssUrl)
      .appendTo(docHead);

    // Load vendor script with attributes that tell it how to load the
    // injected Esper script
    var esperScriptAttrs = {};
    esperScriptAttrs["id"] = "esper-script";
    esperScriptAttrs["src"] = scriptUrl;
    esperScriptAttrs["data-root-url"] = rootUrl;
    $("<script id='esper-vendor-script'/>")
      .attr("src", vendorScriptUrl)
      .attr("data-load-next", JSON.stringify(esperScriptAttrs))
      .appendTo(docHead);
  }

  export function init() : void {
    Log.tag = "Esper [CS]";
    Log.d("Initializing content script");

    if (HostUrl.isGmail(document.URL)) {
      injectScript("gmail-is.js");

    } else if (HostUrl.isGcal(document.URL)) {
      injectScript("gcal-is.js");
    }

    Api.init();
    Update.init();
    Auth.init();
    ExtensionOptions.init();
    ThreadState.init();
    CalSidebar.init();

    // Miscellaneous messaging setup
    Message.pipeToExtension(Message.Type.OpenExtensionOptions);
    Message.pipeToExtension(Message.Type.Track);
    Message.pipeToExtension(Message.Type.Identify);
    Message.listen(Message.Type.RenderGettingStarted, function() {
      Auth.openWelcomeModal(Login.getAccount(), true, true);
      Onboarding.CurrentSlide.set(4);
    });

    // Listen to location changes
    Location.init();
  }
}

/* Called once per page */
Esper.Main.init();
