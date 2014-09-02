module Esper.ActiveEvents {

  var activeEvents: {
    [calendarId: string]: LRU.C<Types.Visited<Types.FullEventId>>
  } = {};
  var cacheCapacity = 5;

  function getCalendarCache(calendarId) {
    var x = activeEvents[calendarId];
    if (x === undefined) {
      x = new LRU.C<Types.Visited<Types.FullEventId>>(Visited.maxEvents,
                                                      Visited.eq);
      activeEvents[calendarId] = x;
    }
    return x;
  }

  function add(x: Types.Visited<Types.FullEventId>) {
    var calId = x.item.calendarId;
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
    add({
      lastVisited: Date.now() / 1000,
      id: x.calendarId + "/" + x.eventId,
      item: x
    });
    var esperMessage : Message.Message = {
      sender: "Esper",
      type: "ActiveEvents",
      value: exportActiveEvents()
    };
    window.postMessage(esperMessage, "*");
  }
}
