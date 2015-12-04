/// <reference path="./Esper.ts" />

/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Analytics.Web.ts" />

/// <reference path="./Layout.tsx" />
/// <reference path="./Route.tsx" />
/// <reference path="./Teams.ts" />

module Esper.Conf {
  export var segmentKey: string; // Set via Dev.ts or Prod.ts
}

module Esper.Main {
  export function init() {
    Login.init();
    Teams.init();
    Calendars.init();
    Route.init();

    if (! TESTING) {
      Analytics.init(Conf.segmentKey);
    }
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);
