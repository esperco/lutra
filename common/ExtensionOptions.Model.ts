/*
  Injected script code for extension options
*/

/// <reference path="./ExtensionOptions.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Message.ts" />

module Esper.ExtensionOptions {
  export var store = new Model.StoreOne<Options>();

  export function init() {
    // Post initial message to request option setting
    Message.post(Message.Type.RequestSettings);

    // Update options based on value from posted messages
    Message.listen(Message.Type.SettingsUpdate, function(opts: Options) {
      store.set(opts);
    });
  }
}
