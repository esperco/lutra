/*
  This is a script injected into any Gmail page by the Esper content script.
  It has access to the same JavaScript environment as Gmail,
  as required by gmail.js.
*/

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/ApiT.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/Conf.ts" />
/// <reference path="../common/List.ts" />
/// <reference path="../common/Lazy.ts" />
/// <reference path="../common/Option.ts" />
/// <reference path="../common/EsperCache.ts" />
/// <reference path="../common/Modal.ts" />
/// <reference path="../common/Util.ts" />
/// <reference path="../common/Watchable.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/XDate.ts" />
/// <reference path="../common/Log.ts" />
/// <reference path="../common/LRU.ts" />
/// <reference path="../common/Visited.ts" />
/// <reference path="../common/EsperStorage.ts" />
/// <reference path="../common/Message.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../common/Profile.ts" />
/// <reference path="../common/Preferences.ts" />
/// <reference path="../common/TaskPreferences.ts" />
/// <reference path="../common/JsonHttp.ts" />

/// <reference path="./Timezone.ts" />
/// <reference path="./Gmail.ts" />
/// <reference path="./Thread.ts" />
/// <reference path="./CalCache.ts" />
/// <reference path="./LocSearch.ts" />
/// <reference path="./Recur.ts" />
/// <reference path="./CalPicker.ts" />
/// <reference path="./CalSearch.ts" />
/// <reference path="./ObserveMessage.ts" />
/// <reference path="./ComposeHashtags.ts" />
/// <reference path="./ComposeControls.ts" />
/// <reference path="./ComposeToolbar.ts" />
/// <reference path="./CurrentThread.ts" />
/// <reference path="./PrefTimezone.ts" />
/// <reference path="./ActiveThreads.ts" />
/// <reference path="./Slides.ts" />
/// <reference path="./FileUpload.ts" />
/// <reference path="./FinalizeEvent.ts" />
/// <reference path="./InviteControls.ts" />
/// <reference path="./EventControls.ts" />
/// <reference path="./TaskList.ts" />
/// <reference path="./TaskMessageList.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./EventWidget.ts" />
/// <reference path="./Menu.ts" />
/// <reference path="./Sidebar.ts" />
/// <reference path="./TaskTab.ts" />
/// <reference path="./InThreadControls.ts" />
/// <reference path="./UserTab.ts" />
/// <reference path="./GroupTab.ts" />
/// <reference path="./GroupScheduling.ts" />
/// <reference path="./BackgroundEvents.ts" />
/// <reference path="./TimeTracker.ts" />
/// <reference path="./Inactivity.ts" />
/// <reference path="./Init.ts" />

module Esper.Main {
  export function init() : void {
    Log.tag = "Esper [IS]";
    Log.d("Initializing injected script");
    Init.init();
  }
}

/* Called once per page, but wait for vendor files to load */
if (Esper.vendorReady) {
  Esper.Main.init();
} else {
  Esper.onVendorReady = Esper.Main.init;
}
