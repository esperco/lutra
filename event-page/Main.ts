/*
  This is a Chrome event page (non-persistent background page).
  It's not a web page, only a javascript script without an html document.
  At most one instance is running for all tabs. The reason to use that is
  to have access to the full chrome.runtime API, which for some unknown
  reasons is not accessible from the content scripts.

    https://developer.chrome.com/extensions/event_pages
*/

module Esper.Main {

  export function init() : void {
    Log.tag = "Esper [EP]";
    Log.d("Initializing event page");
    Update.init();
  }
}

/* Called once */
Esper.Main.init();
