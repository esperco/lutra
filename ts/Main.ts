// Include all references prior to Main. If not referenced, TSC will not
// bundle into app.js. Main is in turn loaded from the Dev or Prod files
// accordingly.

/* Main modules */

/// <reference path="../marten/ts/Log.ts" />
/// <reference path="../marten/ts/Watchable.ts" />
/// <reference path="../marten/ts/JsonHttp.ts" />
/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/Api.ts" />

/// <reference path="Test.ts"/>
/// <reference path="List.ts"/>
/// <reference path="Analytics.ts"/>
/// <reference path="Deferred.ts"/>
/// <reference path="Promise.ts"/>
/// <reference path="XDate.ts"/>
/// <reference path="Util.ts"/>
/// <reference path="GmailCompose.ts"/>
/// <reference path="Pay.ts"/>
/// <reference path="Status.ts"/>
/// <reference path="Cache.ts"/>
/// <reference path="Svg.ts"/>
/// <reference path="Show.ts"/>
/// <reference path="Store.ts"/>
/// <reference path="ParseUrl.ts"/>
/// <reference path="Login.ts"/>
/// <reference path="CalPicker.ts"/>
/// <reference path="Settings.ts"/>
/// <reference path="Signin.ts"/>
/// <reference path="Footer.ts"/>
/// <reference path="TeamSettings.ts"/>
/// <reference path="Plan.ts"/>
/// <reference path="AccountTab.ts"/>
/// <reference path="Preferences.ts"/>
/// <reference path="PreferencesTab.ts"/>
/// <reference path="WorkflowsTab.ts"/>
/// <reference path="CalendarsTab.ts"/>
/// <reference path="LabelsTab.ts"/>
/// <reference path="UsageTab.ts"/>
/// <reference path="AboutTab.ts"/>
/// <reference path="TemplateTab.ts"/>
/// <reference path="UsagePeriod.ts"/>
/// <reference path="ApproveTeam.ts"/>
/// <reference path="Page.ts"/>
/// <reference path="Route.ts"/>




module Esper.Main {

  function main() {
    Analytics.init();
    Svg.init();
    Login.initCredentials();
    Route.setup();
    Status.init();
    Pay.init();
    (<any> $("[data-toggle='tooltip']")).tooltip(); // FIXME

    // In case we forgot to hide loading screen somewhere
    setTimeout(function() {
      $('#init-loading').fadeOut();
    }, 5000);
  }

  $(document).ready(main);

}
