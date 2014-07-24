/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Main {
  function injectScript() {
    var rootUrl = chrome.extension.getURL("");
    var cssUrl = chrome.extension.getURL("css/injected-script.css");
    var scriptUrl = chrome.extension.getURL("js/injected-script.js");
    var docHead = $("head");
    $("<link rel='stylesheet' type='text/css'/>")
      .attr("href", cssUrl)
      .appendTo(docHead);
    $("<script id='esper-script'/>")
      .attr("src", scriptUrl)
      .attr("data-root-url", rootUrl)
      .appendTo(docHead);
  }

  export function init() : void {
    Log.tag = "Esper [CS]";
    Log.d("Initializing content script");
    if ((/^https:\/\/mail.google.com\//).test(document.URL))
      injectScript();
    Auth.init();
  }
}

/* Called once per page */
Main.init();
