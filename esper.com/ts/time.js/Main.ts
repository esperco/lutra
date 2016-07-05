/// <reference path="./_lib.ts" />

declare module Esper {
  export var PRODUCTION: boolean;
  export var TESTING: boolean;
  export var pageJs: PageJS.Static;
}

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
    Labels.init();
    Login.init();
    Login.promise.done(function() {
      Stores.Profiles.init();
      Stores.TeamPreferences.init();
    });
  }
}

/*
  Init only after everything else done loading
*/
window.requestAnimationFrame(Esper.Main.init);
