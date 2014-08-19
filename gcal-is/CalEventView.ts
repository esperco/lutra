/*
  Google Calendar event view
*/
module Esper.CalEventView {
  var currentEventId : Gcal.Event.FullEventId;

  function checkForNewEventId(callback: (x: Gcal.Event.FullEventId) => void) {
    var oldEventId = currentEventId;
    currentEventId = Gcal.Event.extractFullEventId();
    if (currentEventId !== undefined
        && ! Gcal.Event.equal(currentEventId, oldEventId)) {
      callback(currentEventId);
    }
    listenForNewEventId(callback);
  }

  function listenForNewEventId(callback: (x: Gcal.Event.FullEventId) => void) {
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
      });
    }
  }
}
