/*
  Eventual replacement for the Events module
*/

/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/Model2.Batch.ts" />
/// <reference path="../lib/Model2.ts" />
/// <reference path="./Period.ts" />

module Esper.Events2 {
  export interface TeamEvent extends ApiT.GenericCalendarEvent {
    teamId: string;
  }

  export function asTeamEvent(teamId: string, e: ApiT.GenericCalendarEvent) {
    return _.extend({teamId: teamId}, e) as TeamEvent;
  }

  export interface FullEventId {
    teamId: string;
    calId: string;
    eventId: string;
  }

  export interface DateId {
    teamId: string;
    calId: string;

    // Start of date
    date: Date;
  }

  export type EventData =
    Model2.StoreData<Events2.FullEventId, Events2.TeamEvent>;

  /*
    Convenience interface for grouping together merged event list with
  */
  export interface EventListData {
    start: Date;
    end: Date;
    events: TeamEvent[];
    isBusy: boolean;
    hasError: boolean;

    // Data for each date in list
    eventsByDate: Model2.BatchStoreData<DateId, FullEventId, TeamEvent>[];
  }


  /* Stores */

  // Store individual events
  export var EventStore = new Model2.Store<FullEventId, TeamEvent>({
    cap: 20000,

    // Function used to work backwards from event to FullEventId
    idForData: storeId
  });

  // Store a list of events for each day
  export var EventsForDateStore = new Model2.BatchStore
    <DateId, FullEventId, TeamEvent>(EventStore, {
      cap: 2000
    });

  // Naively resets store (for refresh)
  export function invalidate() {
    EventsForDateStore.reset();
    EventStore.reset();
  }


  /* API */

  export function fetchForPeriod({teamId, calId, period, force=false}: {
    teamId: string,
    calId: string,
    period: Period.Single,
    force?: boolean;
  }) {

    // Check if data is cached before loading
    var bounds = Period.boundsFromPeriod(period);
    return fetch({
      teamId: teamId,
      calId: calId,
      start: bounds[0],
      end: bounds[1],
      force: force
    });
  }

  export function fetch({teamId, calId, start, end, force=false}: {
    teamId: string,
    calId: string,
    start: Date,
    end: Date,
    force?: boolean;
  }) {
    var dates = datesFromBounds(start, end);
    var eventsForDates = _.map(dates, (d) => EventsForDateStore.get({
      calId: calId, teamId: teamId, date: d
    }));
    if (force || _.find(eventsForDates, (e) => e.isNone())) {
      var apiP = Api.postForGenericCalendarEvents(teamId, calId, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      });

      EventsForDateStore.transactP(apiP, (apiP2) =>
        EventStore.transactP(apiP2, (apiP3) => {
          _.each(dates, (d) => {
            var dateP = apiP3.then((eventList) => {
              var events = _.filter(eventList.events,
                (e) => overlapsDate(e, d)
              );
              return Option.wrap(_.map(events,
                (e): Model2.BatchVal<FullEventId, TeamEvent> => ({
                  itemKey: {
                    teamId: teamId,
                    calId: calId,
                    eventId: e.id
                  },
                  data: Option.some(asTeamEvent(teamId, e))
                })));
            });
            EventsForDateStore.batchFetch({
              teamId: teamId, calId: calId, date: d
            }, dateP);
          });
        })
      );
    }
  }

  export function getForPeriod({teamId, calId, period}: {
    teamId: string,
    calId: string,
    period: Period.Single,
  }): Option.T<EventListData> {
    var bounds = Period.boundsFromPeriod(period);
    return get({
      teamId: teamId,
      calId: calId,
      start: bounds[0],
      end: bounds[1]
    });
  }

  export function get({teamId, calId, start, end}: {
    teamId: string,
    calId: string,
    start: Date,
    end: Date,
  }): Option.T<EventListData> {
    var dates = datesFromBounds(start, end);
    var eventsByDate = _.map(dates, (d) =>
      EventsForDateStore.batchGet({
        teamId: teamId,
        calId: calId,
        date: d
      }));

    return _.find(eventsByDate, (e) => e.isNone()) ?
      Option.none<EventListData>() :
      Option.some(((): EventListData => {
        var unwrappedEventsByDate = _.map(eventsByDate, (e) => e.unwrap());

        var events: TeamEvent[] = [];
        _.each(unwrappedEventsByDate, (e) => e.data.match({
          none: () => null,
          some: (list) => _.each(list, (eventOpt) => eventOpt.data.match({
            none: () => null,
            some: (event) => events.push(event)
          }))
        }));
        events = _.uniqBy(events, (e) => e.id);

        var isBusy = !!_.find(unwrappedEventsByDate,
          (e) => e.dataStatus === Model2.DataStatus.FETCHING);
        var hasError = !!_.find(unwrappedEventsByDate,
          (e) => e.dataStatus === Model2.DataStatus.FETCH_ERROR);

        return {
          start: start,
          end: end,
          events: events,
          isBusy: isBusy,
          hasError: hasError,
          eventsByDate: unwrappedEventsByDate
        };
      })());
  }

  export function fetch1(fullEventId: FullEventId, forceRefresh=false) {
    if (forceRefresh || EventStore.get(fullEventId).isNone()) {
      var p = Api.getGenericEvent(
        fullEventId.teamId,
        fullEventId.calId,
        fullEventId.eventId
      ).then((e: ApiT.GenericCalendarEvent) =>
        Option.wrap(asTeamEvent(fullEventId.teamId, e))
      );
      EventStore.fetch(fullEventId, p);
      return p;
    } else {
      return $.Deferred().resolve(EventStore.get(fullEventId).unwrap().data)
    }
  }

  export var fetchOne = fetch1;


  /* Helpers */
  export function datesFromBounds(start: Date, end: Date) {
    var startM = moment(start).startOf('day');
    var endM = moment(end).endOf('day');
    var ret: Date[] = [];
    while (endM.diff(startM) > 0) {
      ret.push(startM.clone().toDate());
      startM = startM.add(1, 'day');
    }
    return ret;
  }

  export function overlapsDate(event: ApiT.GenericCalendarEvent, date: Date) {
    var dayStart = moment(date).clone().startOf('day');
    var eventEnd = moment(event.end);
    if (dayStart.diff(eventEnd) >= 0) {
      return false;
    }

    var dayEnd = moment(date).clone().endOf('day');
    var eventStart = moment(event.start);
    return eventStart.diff(dayEnd) < 0;
  }

  // Returns true if two events are part of the same recurring event
  export function matchRecurring(e1: TeamEvent, e2: TeamEvent) {
    return e1.calendar_id === e2.calendar_id &&
      e1.teamId === e2.teamId &&
      (e1.recurring_event_id ?
       e1.recurring_event_id === e2.recurring_event_id :
       e1.id === e2.id);
  }

  export function storeId(event: TeamEvent): FullEventId {
    return {
      teamId: event.teamId,
      calId: event.calendar_id,
      eventId: event.id
    }
  }

  export function matchId(event: TeamEvent, storeId: FullEventId) {
    return event && storeId &&
      event.id === storeId.eventId &&
      event.calendar_id === storeId.calId &&
      event.teamId === storeId.teamId;
  }
}
