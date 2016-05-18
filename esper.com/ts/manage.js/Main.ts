/// <reference path="./_lib.ts" />

declare module Esper {
  export var PRODUCTION: boolean;
  export var TESTING: boolean;
}

module Esper.Main {
  export function init() {
    if (Esper.TESTING) {
      Route.setBase("/test-manage");
    } else {
      Route.setBase("/manage");
      initAll();
      Route.init();
    }
  }

  export function initAll() {
    Stores.Teams.init();
    Stores.Calendars.init();
    Login.init();
    Login.promise.done(function() {
      Stores.Preferences.init();
    });
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);