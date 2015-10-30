/// <reference path="./Esper.ts" />

/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.ts" />
/// <reference path="../marten/ts/Login.Iframe.ts" />
/// <reference path="../marten/ts/Api.ts" />

/// <reference path="./Layout.tsx" />
/// <reference path="./Route.tsx" />
/// <reference path="./TimeStats.ts" />

module Esper.Main {
  export function init() {
    Login.init();
    Route.init();
  }
}

// Init only after everything else done loading
window.requestAnimationFrame(Esper.Main.init);
