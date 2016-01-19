/*
  This is a script injected into any Gmail page by the Esper content script.
  It has access to the same JavaScript environment as Gmail,
  as required by gmail.js.
*/

/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/cryptojs/cryptojs.d.ts" />

/// <reference path="../lib/Log.ts" />
/// <reference path="../lib/JsonHttp.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/Watchable.ts" />
/// <reference path="../lib/XDate.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/List.ts" />
/// <reference path="../common/Util.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/LRU.ts" />
/// <reference path="../common/Visited.ts" />
/// <reference path="../common/EsperStorage.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Modal.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/ReminderView.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/Analytics.ts" />

/// <reference path="../common/Option.ts" />
/// <reference path="../common/Team.ts" />
/// <reference path="../common/TaskList.ts" />
/// <reference path="../common/Agenda.ts" />
/// <reference path="../common/Timezone.ts" />
/// <reference path="../common/Menu.ts" />

/// <reference path="./Gcal.ts" />
/// <reference path="./CalEventView.ts" />
/// <reference path="./CalSidebar.tsx" />
/// <reference path="./Init.ts" />

module Esper.Main {
  export function init() : void {
    Log.tag = "Esper [IS]";
    Log.d("Initializing injected script");
    Init.init();
  }
}

/* Called once per page */
Esper.Main.init();
