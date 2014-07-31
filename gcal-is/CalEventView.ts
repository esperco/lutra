/*
  Google Calendar event view
*/
module CalEventView {
  var currentEventId : CalEvent.FullEventId;

  function checkForNewEventId(callback: (x: CalEvent.FullEventId) => void) {
    var oldEventId = currentEventId;
    currentEventId = CalEvent.extractFullEventId();
    if (currentEventId !== undefined
        && ! CalEvent.equal(currentEventId, oldEventId)) {
      callback(currentEventId);
    }
    listenForNewEventId(callback);
  }

  function listenForNewEventId(callback: (x: CalEvent.FullEventId) => void) {
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
