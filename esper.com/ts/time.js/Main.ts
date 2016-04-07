/// <reference path="./Esper.ts" />

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../lib/ApiC.ts" />

/// <reference path="./Route.tsx" />
/// <reference path="./Teams.ts" />
/// <reference path="./Colors.ts" />

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
    Teams.init();
    Colors.init();
    Calendars.init();
    Login.init();
    Login.promise.done(function() {
      ApiC.getAllProfiles()
    });
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);
