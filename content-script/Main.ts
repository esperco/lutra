/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Main {
  function injectScript() {
    var scriptUrl = chrome.extension.getURL("js/injected-script.js");
    $("<script/>")
      .attr("src", scriptUrl)
      .appendTo($("head"));
  }

  export function init() : void {
    Log.d("Main.init()");
    Auth.init();
    injectScript();
  }
}

/* Called once per page */
Main.init();
