/*
  This is a script injected into any Gmail page by the Esper content script.
  It has access to the same JavaScript environment as Gmail,
  as required by gmail.js.
*/

module Main {
  export function init() : void {
    Log.d("Initializing injected script");
    Auth.init();
  }
}

/* Called once per page */
Main.init();
