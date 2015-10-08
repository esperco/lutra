/*
  Watch and respond to current event in Google Calendar
*/

/// <reference path="../common/Message.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="./Gcal.ts" />

module Esper.CurrentEvent {

  // Watcher for reference to current event
  export var eventId = new Esper.Watchable.C<Types.FullEventId>(
    function(fullEvent) { return fullEvent && fullEvent.eventId; },
    undefined
  );

  // Watch hash change
  var initialized = false;
  export function init() {
    if (! initialized) {

      /*
        Google Calendar's initial hash value isn't a reliable source of
        information and doesn't appear to be used on load by Google, but
        it can confuse our hashchange watcher, so blank it out initially.
      */
      var initHash = "#init"
      location.hash = initHash;

      /*
        Update eventId on location change
      */
      Message.listen(Message.Type.LocationUpdate, function() {
        // Initial hash implies this listener is just being called due to
        // us setting the hash above.
        if (window.location.hash !== initHash) {
          eventId.set(Gcal.Event.extractFullEventIdFromHash());
        }
      });

      /*
        Unlike the initial hash, the "eid" param is used by Google to control
        the initial event rendered. If this is set in the URL, use this for
        our initial eventId.
      */
      eventId.set(Gcal.Event.extractFullEventIdFromParam());

      initialized = true;
    }
  }
}