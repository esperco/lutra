/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Esper.Main {
  function injectScript(scriptName) {
    Log.d("Injecting script " + scriptName);
    var rootUrl = chrome.extension.getURL("");
    var cssUrl = chrome.extension.getURL("css/esper.css");
    var fullCalendarCss = chrome.extension.getURL("css/fullCalendar.css");
    var scriptUrl = chrome.extension.getURL("js/" + scriptName);
    var docHead = $("head");
    $("<link rel='stylesheet' type='text/css'/>")
      .attr("href", cssUrl)
      .appendTo(docHead);
    $("<link rel='stylesheet' type='text/css'/>")
      .attr("href", fullCalendarCss)
      .appendTo(docHead);
    $("<script id='esper-script'/>")
      .attr("src", scriptUrl)
      .attr("data-root-url", rootUrl)
      .appendTo(docHead);
  }

  export function init() : void {
    Log.tag = "Esper [CS]";
    Log.d("Initializing content script");

    if (HostUrl.isGmail(document.URL))
      injectScript("gmail-is.js");

    else if (HostUrl.isGcal(document.URL))
      injectScript("gcal-is.js");

    Update.init();
    Auth.init();
  }
}

/* Called once per page */
Esper.Main.init();
