/*
  Google Calendar event view
*/
module Esper.CalEventView {
  var currentEventId : Types.FullEventId;

  function checkForNewEventId(callback: (x: Types.FullEventId) => void) {
    var oldEventId = currentEventId;
    currentEventId = Gcal.Event.extractFullEventId();
    if (currentEventId !== undefined
        && ! Gcal.Event.equal(currentEventId, oldEventId)) {
      callback(currentEventId);
    }
    listenForNewEventId(callback);
  }

  function listenForNewEventId(callback: (x: Types.FullEventId) => void) {
    setTimeout(function() {
      checkForNewEventId(callback);
    }, 1000);
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForNewEventId(function(fullEventId) {
        Log.d("New current event ID:", fullEventId);
        ActiveEvents.handleNewActiveEvent(fullEventId);
      });
    }
  }
}
