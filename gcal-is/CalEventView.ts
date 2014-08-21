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
  }

  function listenForNewEventId(callback: (x: Types.FullEventId) => void) {
    Util.every(300, function() {
      checkForNewEventId(callback);
    });
  }

  /* Find a good insertion point, on the right-hand side
     of the "Add guests" column. */
  function findAnchor() {
    var anchor = $("div.ep-dp");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper event controls.");
      return $();
    }
    else
      return anchor;
  }

  function removeEsperRoot() {
    $("#esper-event-root").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = findAnchor();
    var root = $("<div id='esper-event-root'/>");
    anchor.append(root);
    return root;
  }

  function updateView(fullEventId) {
    var rootElement = insertEsperRoot();
    /* For each team that uses this calendar */
    rootElement.text("Hello from Esper!");
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForNewEventId(function(fullEventId) {
        Log.d("New current event ID:", fullEventId);
        ActiveEvents.handleNewActiveEvent(fullEventId);
        updateView(fullEventId);
      });
    }
  }
}
