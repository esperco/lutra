/*
  This is a script injected into any Gmail page by the Esper content script.
  It has access to the same JavaScript environment as Gmail,
  as required by gmail.js.
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />
/// <reference path="../marten/typings/cryptojs/cryptojs.d.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/Conf.ts" />
/// <reference path="../common/List.ts" />
/// <reference path="../common/Util.ts" />
/// <reference path="../common/Watchable.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/XDate.ts" />
/// <reference path="../common/Log.ts" />
/// <reference path="../common/LRU.ts" />
/// <reference path="../common/Visited.ts" />
/// <reference path="../common/EsperStorage.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Modal.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/ReminderView.ts" />
/// <reference path="../common/JsonHttp.ts" />
/// <reference path="../common/ApiT.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/Analytics.IS.ts" />

/// <reference path="../common/Menu.ts" />
/// <reference path="../common/Option.ts" />
/// <reference path="../common/TaskList.ts" />
/// <reference path="../common/Agenda.ts" />
/// <reference path="../common/Timezone.ts" />

/// <reference path="./Gcal.ts" />
/// <reference path="./ActiveEvents.ts" />
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
