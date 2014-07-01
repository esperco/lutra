/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Main {
  export function init() : void {
    Log.d("Main.init()");
    Auth.init();
  }
}

/* Called once per page */
Main.init();
