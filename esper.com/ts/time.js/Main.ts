/// <reference path="./_lib.ts" />
/// <reference path="./Esper.ts" />

module Esper.Conf {
  export var segmentKey: string; // Set via Dev.ts or Prod.ts
}

module Esper.Main {
  export function init() {
    if (Esper.TESTING) {
      Route.setBase("/test-time");
    } else {
      Route.setBase("/time");
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
      ApiC.getAllProfiles();
      Stores.Preferences.init();
    });
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);
