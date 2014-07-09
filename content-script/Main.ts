/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Main {
  function injectScript() {
    var cssUrl = chrome.extension.getURL("css/injected-script.css");
    var scriptUrl = chrome.extension.getURL("js/injected-script.js");
    var docHead = $("head");
    $("<link rel='stylesheet' type='text/css'/>")
      .attr("href", cssUrl)
      .appendTo(docHead);
    $("<script/>")
      .attr("src", scriptUrl)
      .appendTo(docHead);
  }

  export function init() : void {
    Log.d("Initializing content script");
    injectScript();
  }
}

/* Called once per page */
Main.init();
