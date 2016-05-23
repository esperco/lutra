/*
  Eventual replacement for the Events module
*/

/// <reference path="./Api.ts" />
/// <reference path="./Labels.ts" />
/// <reference path="./Model2.Batch.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Profiles.ts" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./XDate.ts" />
/// <reference path="./Period.ts" />

module Esper.Stores.Events {

  /* Type modification */

  const PREDICTED_LABEL_PERCENT_CUTOFF = 0.2;
  const PREDICTED_LABEL_MODIFIER = 0.95;

  /*
    Similar to ApiT.GenericCalendarEvent but with some teamId and different
    representation of labels, camelCase, and removal of fields we don't care
    about at the moment
  */
  export interface TeamEvent {
    id: string;
    calendarId: string;
    teamId: string;
    start: Date;
    end: Date;
    timezone: string;
    title: string;
    description: string;

    labelScores: Option.T<Labels.Label[]>;

    feedback: ApiT.EventFeedback;
    location: string;
    allDay: boolean;
    guests: ApiT.Attendee[];
    transparent: boolean;
    recurringEventId?: string;
  }

  export function asTeamEvent(teamId: string, e: ApiT.GenericCalendarEvent)
    : TeamEvent
  {
    var labelScores = (() => {
      if (e.labels_norm) {
        return Option.some(_.map(e.labels_norm, (n, i) => ({
          id: n,
          displayAs: e.labels[i],
          score: 1
        })));
      } else if (Util.notEmpty(e.predicted_labels)) {
        var team = Teams.require(teamId);
        if (team) {
          var labels = _.filter(e.predicted_labels,
            (l) => _.includes(team.team_labels_norm, l.label_norm));
          var topPrediction = labels[0];
          if (topPrediction &&
              topPrediction.score > PREDICTED_LABEL_PERCENT_CUTOFF) {
            return Option.some([{
              id: topPrediction.label_norm,
              displayAs: topPrediction.label,
              score: PREDICTED_LABEL_MODIFIER * topPrediction.score
            }]);
          }
        }
      }
      return Option.none<Labels.Label[]>();
    })();

    return {
      id: e.id,
      calendarId: e.calendar_id,
      teamId: teamId,
      start: moment(e.start).toDate(),
      end: moment(e.end).toDate(),
      timezone: e.timezone || moment.tz.guess(),
      title: e.title || "",
      description: e.description || "",
      labelScores: labelScores,
      feedback: e.feedback,
      location: e.location || "",
      allDay: e.all_day,
      guests: e.guests,
      transparent: e.transparent,
      recurringEventId: e.recurring_event_id
    };
  }


  /* Store Interfaces */

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
    Model2.StoreData<FullEventId, TeamEvent>;

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


  /* Old calendar-based API */

  export function fetchForPeriod({teamId, calId, period, force=false}: {
    teamId: string,
    calId: string,
    period: Period.Single|Period.Custom,
    force?: boolean;
  }) {
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


  /* Predictions-based API */

  export function fetchPredictionsForPeriod({teamId, period, force=false}: {
    teamId: string;
    period: Period.Single|Period.Custom,
    force?: boolean;
  }) {
    var bounds = Period.boundsFromPeriod(period);
    return fetchPredictions({
      teamId: teamId,
      start: bounds[0],
      end: bounds[1],
      force: force
    });
  }

  export function fetchPredictions({teamId, start, end, force=false}: {
    teamId: string,
    start: Date,
    end: Date,
    force?: boolean;
  }) {
    var dates = datesFromBounds(start, end);
    var team = Stores.Teams.require(teamId);
    if (! team) return;

    var calIds = team.team_timestats_calendars
    var doFetch = force || !!_.find(calIds, (calId) =>
      _.find(dates, (date) =>
        EventsForDateStore.get({
          calId: calId, teamId: teamId, date: date
        }).isNone()
      )
    );

    if (doFetch) {
      var apiP = Api.postForTeamEvents(teamId, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      });

      EventsForDateStore.transactP(apiP, (apiP2) =>
        EventStore.transactP(apiP2, (apiP3) => {
          _.each(calIds, (calId) => _.each(dates, (d) => {

            var dateP = apiP3.then((eventCollection) => {
              var eventList = eventCollection[calId] ?
                eventCollection[calId].events : [];
              var events = _.filter(eventList,
                (e) => overlapsDate(e, d)
              );
              return Option.wrap(_.map(events,
                (e): Model2.BatchVal<FullEventId, TeamEvent> => ({
                  itemKey: {
                    teamId: teamId,
                    calId: e.calendar_id,
                    eventId: e.id
                  },
                  data: Option.some(asTeamEvent(teamId, e))
                })));
            });

            EventsForDateStore.batchFetch({
              teamId: teamId, calId: calId, date: d
            }, dateP);
          }))
        })
      );
    }
  }


  /* Get from store */

  export function getForPeriod({teamId, calId, period}: {
    teamId: string,
    calId: string,
    period: Period.Single|Period.Custom,
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
    return e1.calendarId === e2.calendarId &&
      e1.teamId === e2.teamId &&
      (e1.recurringEventId ?
       e1.recurringEventId === e2.recurringEventId :
       e1.id === e2.id);
  }

  export function storeId(event: TeamEvent): FullEventId {
    return {
      teamId: event.teamId,
      calId: event.calendarId,
      eventId: event.id
    }
  }

  export function matchId(event: TeamEvent, storeId: FullEventId) {
    return event && storeId &&
      event.id === storeId.eventId &&
      event.calendarId === storeId.calId &&
      event.teamId === storeId.teamId;
  }

  // Does this event occur in the future?
  export function isFuture(event: TeamEvent) {
    return moment(event.start).diff(moment()) > 0;
  }


  /* Helpers for extracting some value we're charting by */

  export function getGuests(event: TeamEvent) {
    // Ignore exec on team
    var execId = Stores.Teams.require(event.teamId).team_executive;

    // Need profiles to get exec email
    var optEmails = Stores.Profiles.get(execId)
      .flatMap((execProfile) => Option.some(
        [execProfile.email].concat(execProfile.other_emails || [])
      ));

    return _.filter(event.guests,
      (g) => g.response !== 'Declined' && optEmails.match({
        none: () => true,
        some: (execEmails) => !_.includes(
          _.map(execEmails, (e) => e.toLowerCase()),
          (g.email || "").toLowerCase()
        )
      })
    );
  }

  export function getGuestEmails(event: TeamEvent,
                                 allowedDomains?: string[]) {
    var ret = _.map(getGuests(event), (g) => (g.email || "").toLowerCase());
    if (allowedDomains) {
      ret = _.filter(ret,
        (email) => _.includes(allowedDomains, email.split('@')[1])
      );
    }
    return ret;
  }

  export function getGuestDomains(event: TeamEvent) {
    return _.uniq(
      _.map(getGuestEmails(event), (email) => email.split('@')[1])
    );
  }

  export function getLabels(event: TeamEvent, includePredicted=true) {
    return event.labelScores.match({
      none: (): Labels.Label[] => [],
      some: (scores) => includePredicted ?
        scores : _.filter(scores, (s) => s.score === 1)
    });
  }

  export function getLabelIds(event: TeamEvent, includePredicted=true) {
    return _.map(getLabels(event), (l) => l.id);
  }

  export function hasEmptyLabels(event: TeamEvent) {
    return event.labelScores.match({
      none: () => false,
      some: (labels) => labels.length === 0
    });
  }

  export function hasPredictedLabels(event: TeamEvent) {
    var labels = getLabels(event, true);
    return labels.length && labels[0].score < 1;
  }

  export function needsConfirmation(event: TeamEvent) {
    return event.labelScores.match({
      none: () => true, // No labels, let user confirm empty set
      some: (labels) => !!_.find(labels, (l) => l.score > 0 && l.score < 1)
    }) && isActive(event);
  }

  export function getTeams(events: TeamEvent[]) {
    // Get the team(s) for events
    return _(events)
      .map((e) => e.teamId)
      .uniq()
      .map((teamId) => Stores.Teams.require(teamId))
      .value();
  }

  export function isActive(event: TeamEvent) {
    return !(event.feedback && event.feedback.attended === false);
  }
}
