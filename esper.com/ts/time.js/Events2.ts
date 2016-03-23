/*
  Eventual replacement for the Events module
*/

/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/Model2.Batch.ts" />
/// <reference path="../lib/Model2.ts" />

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

  /*
    Used to represent a chunk of time relative to now:

    { incr: 0, interval: 'month' }    // Current month
    { incr: 1, interval: 'week' }     // Next week
    { incr: -2, interval: 'quarter' } // Two quarters ago
  */
  export interface RelativePeriod {
    incr?: number,
    interval: 'week'|'month'|'quarter'
  }

  /*
    Convenience interface for grouping together merged event list with
  */
  interface EventListData {
    period: RelativePeriod;
    events: TeamEvent[];
    isBusy: boolean;
    hasError: boolean;

    // Data for each date in list
    eventsByDate: Model2.BatchStoreData<DateId, FullEventId, TeamEvent>[];
  }

  /* Stores */

  // Store individual events
  export var EventStore = new Model2.Store<FullEventId, TeamEvent>({
    cap: 9000,

    // Function used to work backwards from event to FullEventId
    idForData: (event) => ({
      teamId: event.teamId,
      calId: event.calendar_id,
      eventId: event.id
    })
  });

  // Store a list of events for each day
  export var EventsForDateStore = new Model2.BatchStore
    <DateId, FullEventId, TeamEvent>(EventStore, {
      cap: 366
    });


  /* API */

  export function fetchForRelativePeriod({teamId, calId, period, force=false}: {
    teamId: string,
    calId: string,
    period: RelativePeriod,
    force?: boolean;
  }) {

    // Check if data is cached before loading
    var dates = datesForRelativePeriod({
      incr: period.incr,
      interval: period.interval
    });
    var eventsForDates = _.map(dates, (d) => EventsForDateStore.get({
      calId: calId, teamId: teamId, date: d
    }));
    if (force || _.find(eventsForDates, (e) => e.isNone())) {

      var bounds = boundsForRelativePeriod({
        incr: period.incr,
        interval: period.interval
      });
      var apiP = Api.postForGenericCalendarEvents(teamId, calId, {
        window_start: XDate.toString(bounds[0].toDate()),
        window_end: XDate.toString(bounds[1].toDate())
      });

      _.each(dates, (d) => {
        var dateP = apiP.then((eventList) => {
          var events = _.filter(eventList.events, (e) => overlapsDate(e, d));
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
    }
  }

  export function getForRelativePeriod({teamId, calId, period}: {
    teamId: string,
    calId: string,
    period: RelativePeriod,
  }): Option.T<EventListData> {
    var dates = datesForRelativePeriod({
      incr: period.incr,
      interval: period.interval
    });
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
          period: period,
          events: events,
          isBusy: isBusy,
          hasError: hasError,
          eventsByDate: unwrappedEventsByDate
        };
      })());
  }


  /* Helpers */

  // List start of all days within RelativePeriod
  export function datesForRelativePeriod({incr=0, interval}: RelativePeriod) {
    var bounds = boundsForRelativePeriod({incr: incr, interval: interval});
    var startM = bounds[0];
    var endM = bounds[1];

    var ret: Date[] = [];
    while (startM < endM) {
      ret.push(startM.clone().toDate());
      startM = startM.add(1, 'day');
    }
    return ret;
  }

  function boundsForRelativePeriod({incr=0, interval}: RelativePeriod)
    : [moment.Moment, moment.Moment]
  {
    var startM = moment().startOf(interval).add(incr, interval);
    var endM = moment().endOf(interval).add(incr, interval);
    return [startM, endM];
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

}
