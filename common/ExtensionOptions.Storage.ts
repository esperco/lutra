/*
  Event Script and Option Page code for retrieving and storing options from
  Chrome profile sync
*/

/// <reference path="./ExtensionOptions.ts" />
/// <reference path="./Message.ts" />
/// <reference path="../marten/typings/lodash/lodash.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />

module Esper.ExtensionOptions {

  // Default options for when option is not set
  var defaultOptions: Options = {
    defaultSidebarState: SidebarOpts.SHOW
  };

  // Store all of our settings under a single key
  var key = "esper-ext-settings";

  export function save(opts: Options, callback?: () => void) {
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

  function postUpdate(opts: Options) {
    Message.post(Message.Type.SettingsUpdate, opts);
  }

  // Listen for changes to chrome storage and send response on change
  function listenForChange() {
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === "sync") {
        var change = (<any> changes)[key];
        if (change) {
          postUpdate(change.newValue);
        }
      }
    });
  }

  // Listen for requests for option data from injected scripts
  function listenForRequest() {
    Message.listen(Message.Type.RequestSettings, function() {
      load(postUpdate);
    });
  }

  var initialized = false;

  // Initialize in content script to post option updates
  export function init() {
    if (! initialized) {
      listenForChange();
      listenForRequest();
      initialized = true;
    }
  }
}
