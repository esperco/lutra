/*
  Module for handling event fetching and updating
*/

/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/XDate.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Events {
  export var EventStore = new Model.CappedStore<ApiT.GenericCalendarEvent>(200)
  export var EventListStore = new Model.BatchStore(EventStore, 20);

  // Link stored events to teams to avoid mixing label data
  export function storeId(teamId: string, event: ApiT.GenericCalendarEvent) {
    return teamId + "|" + event.id;
  }

  function keyForRequest(teamId: string, calId: string, start: Date, end: Date)
  {
    return [
      teamId, calId,
      start.getTime().toString(),
      end.getTime().toString()
    ].join(" ");
  }

  export function fetch(teamId: string, calId: string, start: Date, end: Date,
    forceRefresh=false): JQueryPromise<ApiT.GenericCalendarEvent[]>
  {
    var key = keyForRequest(teamId, calId, start, end);
    if (forceRefresh || !EventListStore.has(key) ||
        EventListStore.metadata(key).dataStatus !== Model.DataStatus.READY) {
      var p = Api.postForGenericCalendarEvents(teamId, calId, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      }).then((calEventList) =>
        _.map(calEventList.events, (e) => [storeId(teamId, e), e])
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