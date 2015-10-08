/*
  Utilities for monitoring hashChange (and maybe other) events tied to the
  in window's location. These are placed in the ContentScript to prevent
  another extension or Google from accidentally overriding our listener.

  Location change messages are posted to the window. Injected scripts can
  listen via:

    Message.listen(Message.Type.LocationUpdate, callback() { ... });

*/

/// <reference path="../common/Message.ts" />

module Esper.Location {
  export function init() {
    window.onhashchange = function() {
      Message.post(Message.Type.LocationUpdate);
    }
  }
}