/// <reference path="./_lib.ts" />

declare module Esper {
  export var PRODUCTION: boolean;
  export var TESTING: boolean;
}

module Esper.Main {
  export function init() {
    Route.setBase("/now");
    initAll();
    Route.init();
  }

  export function initAll() {
    Stores.Teams.init();
    Stores.Calendars.init();
    Labels.init();
    Login.init(true);
    Login.promise.done(function() {
      Stores.TeamPreferences.init();
      Stores.Profiles.init();
    });
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);
