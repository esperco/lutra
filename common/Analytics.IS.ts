/*
  This contains Analytics code specific to the injected script side of things,
  and is used mostly to post event-tracking messages to the content script.
*/

/// <reference path="./Analytics.ts" />
/// <reference path="./Message.ts" />

module Esper.Analytics {
  export function track(event: Trackable, properties?: Object) {
    Message.post(Message.Type.Track, (<TrackMessage> {
      event: event,
      properties: properties
    }));
  }
}