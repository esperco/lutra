/*
  Module for handling event fetching and updating
*/

/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/XDate.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Events {
  export var EventStore = new Model.CappedStore<ApiT.CalendarEvent>(200)
  export var EventListStore = new Model.BatchStore(EventStore, 20);

  function keyForRequest(teamId: string, calId: string, start: Date, end: Date)
  {
    return [
      teamId, calId,
      start.getTime().toString(),
      end.getTime().toString()
    ].join(" ");
  }

  export function fetch(teamId: string, calId: string, start: Date, end: Date,
    forceRefresh=false): JQueryPromise<ApiT.CalendarEvent[]>
  {
    var key = keyForRequest(teamId, calId, start, end);
    if (forceRefresh || !EventListStore.has(key) ||
        EventListStore.metadata(key).dataStatus !== Model.DataStatus.READY) {
      var p = Api.postCalendar(teamId, calId, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      }).then((calEventList) =>
        _.map(calEventList.events, (e) => [Calendars.getEventId(e), e])
      );
      EventListStore.batchFetch(key, p);
      return p.then(() => {
        return EventListStore.batchVal(key);
      });
    }

    // Wrap existing results in promise
    else {
      return $.Deferred().resolve(EventListStore.batchVal(key)).promise();
    }
  }

  export function get(teamId: string, calId: string, start: Date, end: Date) {
    var key = keyForRequest(teamId, calId, start, end);
    return EventListStore.batchVal(key);
  }
}