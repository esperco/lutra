/* Aardvark serves no particular purpose other than to be loaded first by
   TypeScript build tools. By listing out our references explicitly, we
   can ensure that files are concatenated in a particular order without 
   having to insert references / imports by other TypeScript files. */

/* Definition files */

/// <reference path="../setup/ts/jquery.d.ts"/>
/// <reference path="../setup/ts/jqueryui.d.ts"/>
/// <reference path="../setup/ts/fullCalendar.d.ts"/>

/* Actual modules */

/// <reference path="Conf.ts"/>
/// <reference path="Test.ts"/>
/// <reference path="List.ts"/>
/// <reference path="Watchable.ts"/>
/// <reference path="Log.ts"/>
/// <reference path="Deferred.ts"/>
/// <reference path="Promise.ts"/>
/// <reference path="XDate.ts"/>
/// <reference path="Util.ts"/>
/// <reference path="MP.ts"/>
/// <reference path="GmailCompose.ts"/>
/// <reference path="Pay.ts"/>
/// <reference path="Status.ts"/>
/// <reference path="Unixtime.ts"/>
/// <reference path="Cache.ts"/>
/// <reference path="Svg.ts"/>
/// <reference path="Show.ts"/>
/// <reference path="Store.ts"/>
/// <reference path="ParseUrl.ts"/>
/// <reference path="Login.ts"/>
/// <reference path="ApiT.ts"/>
/// <reference path="Api.ts"/>
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
/// <reference path="ExecutivePreferences.ts"/>
/// <reference path="UsageTab.ts"/>
/// <reference path="AboutTab.ts"/>
/// <reference path="UsagePeriod.ts"/>
/// <reference path="Page.ts"/>
/// <reference path="Route.ts"/>
/// <reference path="Main.ts"/>

module Aardvark {
  export var name: string = "Aardvark!";
}