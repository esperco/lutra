/// <reference path="./Esper.ts" />

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../lib/XDate.ts" />

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
  }
}

/*
  Init only after everything else done loading (i.e. stuff in Prod.ts and
  Dev.ts)
*/
window.requestAnimationFrame(Esper.Main.init);

/*
  Temporary hack to allow manual CSV access from TimeStats directly
*/
module Esper {
  export function getCSV(days=30) {
    var now = new Date();
    var start = new Date(now.getTime() - days*86400000);
    var q = {
      window_start: XDate.toString(start),
      window_end:   XDate.toString(now)
    }

    var v = Calendars.SelectStore.val();
    if (! v) {
      Log.e("Select calendar!");
      return;
    }

    Api.postForCalendarEventsCSV(v.teamId, v.calId, q)
      .done(function(csv) {
        window.open("data:text/csv;charset=utf-8," + encodeURI(csv));
      });
  }
}
