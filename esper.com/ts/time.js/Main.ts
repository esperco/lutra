/// <reference path="./_lib.ts" />
/// <reference path="./Esper.ts" />

module Esper.Main {
  export function init() {
    Route.setBase("/time");
    if (Esper.TESTING) {
      pageJs.base("/test-time");
    } else {
      initAll();
      Route.init();
    }
  }

  export function initAll() {
    Stores.Teams.init();
    Stores.Calendars.init();
    Colors.init();
    Login.init();
    Login.promise.done(function() {
      Stores.Profiles.init();
      Stores.Preferences.init();
    });
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);
