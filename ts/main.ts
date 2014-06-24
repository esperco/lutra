/*
  This is a Chrome content script.
  The only part of the Chrome API that we can access is chrome.extension.

    https://developer.chrome.com/extensions/content_scripts
*/

module Main {
  export function init() : void {
    console.log("Hello.");
  }
}

Main.init();
