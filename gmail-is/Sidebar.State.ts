/*
  Track current sidebar state for each model
*/

/// <reference path="../common/ExtensionOptions.Model.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />

module Esper.Sidebar {
  // K/V map from threadId to whether or not to show the sidebar
  export var threadState = new Model.CappedStore<ExtensionOptions.SidebarOpts>();
}