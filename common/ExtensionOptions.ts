// Options for Chrome extension -- these get synced

/// <reference path="../marten/typings/lodash/lodash.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />

module Esper.ExtensionOptions {

  // How Esper sidebar is displayed in Gmail
  export enum SidebarOpts { HIDE, SHOW };

  // What our global options object looks like
  export interface Options {
    defaultSidebarState: SidebarOpts;
  };

  // Default options for when option is not set
  var defaultOptions: Options = {
    defaultSidebarState: SidebarOpts.SHOW
  };

  // Store all of our settings under a single key
  var key = "esper-ext-settings";

  export function save(opts: Options, callback?: () => void)  {
    var data: any = {};
    data[key] = opts;
    chrome.storage.sync.set(data, callback);
  }

  export function load(callback: (opts: Options) => void) {
    chrome.storage.sync.get(key, function(data) {
      var opts = (<Options> (<any> data)[key]);
      opts = (<Options> _.extend({}, defaultOptions, opts));
      callback(opts);
    });
  }
}
