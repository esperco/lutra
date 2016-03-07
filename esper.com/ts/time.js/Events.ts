/*
  Module for handling event fetching and updating
*/

/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/Model.Batch.ts" />
/// <reference path="../lib/XDate.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Events {
  export interface TeamEvent extends ApiT.GenericCalendarEvent {
    teamId: string;
  }

  export function asTeamEvent(teamId: string, e: ApiT.GenericCalendarEvent) {
    return _.extend({teamId: teamId}, e) as TeamEvent;
  }

  export var EventStore = new Model.CappedStore<TeamEvent>(9000)
  export var EventListStore = new Model.BatchStore(EventStore, 20);

  // Link stored events to teams to avoid mixing label data
  export function storeId(event: TeamEvent) {
    return keyForEvent(event.teamId, event.calendar_id, event.id);
  }

  export function keyForEvent(teamId: string, calId: string, eventId: string) {
    return teamId + "|" + calId + "|" + eventId;
  }

  // Returns true if two events are part of the same recurring event
  export function matchRecurring(e1: TeamEvent, e2: TeamEvent) {
    return e1.calendar_id === e2.calendar_id &&
      e1.teamId === e2.teamId &&
      (e1.recurring_event_id ?
       e1.recurring_event_id === e2.recurring_event_id :
       e1.id === e2.id);
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
        _.map(calEventList.events, (e) => {
          var te = asTeamEvent(teamId, e);
          return [storeId(te), te];
        })
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

  export function fetch1(teamId:string, calId:string, eventId:string,
                         forceRefresh=false)
  {
    var key = keyForEvent(teamId, calId, eventId);
    if (forceRefresh || !EventStore.has(key)) {
      var p = Api.getGenericEvent(teamId, calId, eventId)
        .then((e: ApiT.GenericCalendarEvent) => asTeamEvent(teamId, e));
      EventStore.fetch(key, p);
      return p;
    } else {
      return $.Deferred().resolve(EventStore.val(key));
    }
  }

  export function get(teamId: string, calId: string, start: Date, end: Date) {
    var key = keyForRequest(teamId, calId, start, end);
    return EventListStore.batchVal(key);
  }

  export function status(teamId: string, calId: string,
    start: Date, end: Date)
  {
    var key = keyForRequest(teamId, calId, start, end);
    return Option.cast(EventListStore.metadata(key))
      .flatMap((m) => Option.wrap(m.dataStatus));
  }

  // Naively invalidate all cached events for now
  export function invalidate() {
    EventListStore.reset();
    EventStore.reset();
    Route.nav.refreshOnce();
  }
}
