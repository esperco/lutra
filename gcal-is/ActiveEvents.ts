module Esper.ActiveEvents {

  /* Equality function used to deduplicate cache elements */
  function eq(a: Types.FullEventId, b: Types.FullEventId) {
    return a.calendarId === b.calendarId && a.eventId === b.eventId;
  }

  var activeEvents: { [calendarId: string]: LRU.C<Types.FullEventId> } = {};
  var cacheCapacity = 5;

  function getCalendarCache(calendarId) {
    var x = activeEvents[calendarId];
    if (x === undefined) {
      x = new LRU.C(cacheCapacity, eq);
      activeEvents[calendarId] = x;
    }
    return x;
  }

  function add(x: Types.FullEventId) {
    var calId = x.calendarId;
    var cache = getCalendarCache(calId);
    cache.add(x);
  }

  function exportActiveEvents(): Types.ActiveEvents {
    var result: Types.ActiveEvents = {
      googleAccountId: Gcal.getUserEmail(),
      calendars: {}
    };
    for (var k in activeEvents) {
      result.calendars[k] = activeEvents[k].all;
    }
    return result;
  }

  export function handleNewActiveEvent(x: Types.FullEventId) {
    add(x);
    var esperMessage : Message.Message = {
      sender: "Esper",
      type: "ActiveEvents",
      value: exportActiveEvents()
    };
    window.postMessage(esperMessage, "*");
  }
}
