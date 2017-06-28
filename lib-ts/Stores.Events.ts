/*
  Eventual replacement for the Events module
*/

/// <reference path="./Api.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Labels.ts" />
/// <reference path="./Log.ts" />
/// <reference path="./Model2.Batch.ts" />
/// <reference path="./Model2.ts" />
/// <reference path="./Stores.Profiles.ts" />
/// <reference path="./Stores.Teams.ts" />
/// <reference path="./Types.ts" />
/// <reference path="./XDate.ts" />
/// <reference path="./Period.ts" />

module Esper.Stores.Events {

  /* Type modification */

  export type TeamEvent = Types.TeamEvent;

  export function asTeamEvent(teamId: string, e: ApiT.GenericCalendarEvent)
    : TeamEvent
  {
    let labels = Option.wrap(e.labels).map(
      (labels) => _.map(labels, (l) => ({
        id: l.normalized,
        displayAs: l.original,
        color: l.color || Colors.getColorForHashtag(l.color)
      })));

    let calendarIds = [e.calendar_id];
    e.duplicates.forEach((d) => calendarIds.push(d.calendar_id));

    return {
      id: e.id,
      calendarIds: _.uniq(calendarIds),
      teamId: teamId,
      start: moment(e.start).toDate(),
      end: moment(e.end).toDate(),
      timezone: e.timezone || moment.tz.guess(),
      title: e.title || "",
      description: e.description || "",
      labels,
      confirmed: !!e.labels_confirmed,

      location: e.location || "",
      allDay: e.all_day,
      guests: e.guests,
      hidden: e.hidden,
      recurringEventId: e.recurring_event_id
    };
  }


  /* Store Interfaces */

  export type FullEventId = Types.FullEventId;
  export type EventData = Model2.StoreData<FullEventId, TeamEvent>;


  /* Stores */

  // Store individual events
  export var EventStore = new Model2.Store<FullEventId, TeamEvent>({
    cap: 20000,

    // Function used to work backwards from event to FullEventId
    idForData: storeId
  });

  // Store a list of events for each day
  export var EventsForDateStore = new Model2.BatchStore
    <Types.FullCalDateId, FullEventId, TeamEvent>(EventStore, {
      cap: 2000
    });

  // Naively resets store (for refresh)
  export function invalidate() {
    EventsForDateStore.reset();
    EventStore.reset();
  }


  /*
    Makes API call to fetch events. Sorting for insertion into store can be a
    little CPU-intensive, so does this in batches for resolving promise.
  */
  interface TeamEventsByDate {
    /*
      Event map from date as stringified integer time to list of events
    */
    [index: string]: TeamEvent[];
  }

  const FETCH_BATCH_SIZE = 10; // How many to process per loop

  function fetchTeamEvents(teamId: string, q: ApiT.CalendarRequest) {
    var dfd = $.Deferred<TeamEventsByDate>();

    /*
      Event map by calendarId to date as stringified integer time
    */
    var eventMap: TeamEventsByDate = {};

    // Scoped vars to populate after API initially returns.
    var index = 0;
    var calendarEvents: ApiT.GenericCalendarEvent[] = [];

    /*
      Named function for recusive calling (must be named in order to avoid
      blowing recursion stack for absurdly large number of events).
    */
    function processEvents() {
      var events = calendarEvents.slice(index, index + FETCH_BATCH_SIZE);
      index += events.length;
      _.each(events, (e) => {
        let teamEvent = asTeamEvent(teamId, e);

        let dates = datesFromBounds(teamEvent.start, teamEvent.end);
        _.each(dates, (d) => {
          let key = d.getTime().toString();
          eventMap[key] = eventMap[key] || [];
          eventMap[key].push(teamEvent);
        });
      });

      if (index < calendarEvents.length) {
        window.requestAnimationFrame(processEvents);
      } else {
        dfd.resolve(eventMap);
      }
    }

    // Make API call, then trigger batch function
    Api.postForTeamEvents(teamId, q).then((resp) => {
      calendarEvents = resp.events;
      processEvents();
    }, (err) => dfd.reject(err));

    return dfd.promise();
  }


  /* Interfaces for querying store data */

  interface TeamQ {
    teamId: string;
    force?: boolean;
  }

  interface PeriodQ {
    period: Types.Period;
  }


  /* Predictions-based API */

  // Fetch predicts for team, return null promise when done
  export function fetchPredictions({teamId, period, force}: TeamQ & PeriodQ) {
    let [start, end] = Period.bounds(period);

    // We store events by day, so make sure we fetch entire start / end
    start = moment(start).startOf('day').toDate();
    end = moment(end).endOf('day').toDate();

    var dates = datesFromBounds(start, end);
    var team = Stores.Teams.require(teamId);
    if (! team) return;

    var doFetch = force || !!_.find(dates,
      (date) => EventsForDateStore.get({
        teamId: teamId, date: date
      }).isNone()
    );

    if (doFetch) {
      var apiP = fetchTeamEvents(teamId, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      });

      EventsForDateStore.transact(() =>
        EventsForDateStore.transactP(apiP, (apiP2) =>
          EventStore.transactP(apiP2, (apiP3) => {
            _.each(dates, (d) => {
              var dateP = apiP3.then((eventMap) => {
                let events = eventMap[d.getTime().toString()] || [];
                return Option.wrap(_.map(events,
                  (e): Model2.BatchVal<FullEventId, TeamEvent> => ({
                    itemKey: {
                      teamId: teamId,
                      eventId: e.id
                    },
                    data: Option.some(e)
                  })));
              });

              EventsForDateStore.batchFetch({
                teamId: teamId, date: d
              }, dateP);
            });
          })
        )
      );

      return apiP.then(() => null);
    }

    return $.Deferred().resolve().promise();
  }


  /* Get from store */

  export function get({period, teamId}: PeriodQ & TeamQ)
    : Option.T<Types.EventsForRangesData>
  {
    let range = _.range(period.start, period.end + 1); // +1 for inclusive
    let isBusy = false;
    let hasError = false;
    let eventsForRanges: Types.EventsForRange[] = [];

    for (let i in range) {
      let index = range[i];
      let [start, end] = Period.bounds({
        interval: period.interval,
        start: index, end: index
      });
      let dates = Period.datesFromBounds(start, end);
      var eventsByDate = _.map(dates, (d) =>
        EventsForDateStore.batchGet({ teamId, date: d })
      )

      // If any none, then all none
      if (_.find(eventsByDate, (e) => e.isNone())) {
        return Option.none<Types.EventsForRangesData>();
      }

      let events: Types.TeamEvent[] = [];
      _.each(Option.flatten(eventsByDate), (e) => {
        // If date is busy or error, then entire list is busy or error
        if (e.dataStatus === Model2.DataStatus.FETCHING) {
          isBusy = true;
        } else if (e.dataStatus === Model2.DataStatus.FETCH_ERROR) {
          hasError = true;
        }

        e.data.match({
          none: () => null,
          some: (list) => _.each(list, (eventOpt) => {
            // If event is busy or error, then entire list is busy or error
            if (eventOpt.dataStatus === Model2.DataStatus.FETCHING) {
              isBusy = true;
            }
            else if (eventOpt.dataStatus === Model2.DataStatus.FETCH_ERROR) {
              hasError = true;
            }

            // Add to list (finally)
            eventOpt.data.match({
              none: () => null,
              some: (event) => events.push(event)
            });
          })
        });
      });

      // Sort by start, then end
      events.sort(sortFn);

      // List of events for start/end dates
      eventsForRanges.push({
        range: [start, end], events
      });
    }

    return Option.some({ eventsForRanges, hasError, isBusy });
  }

  export function require(q: PeriodQ & TeamQ)
    : Types.EventsForRangesData
  {
    // Assume start and end exist
    return get(q).match({
      some: (d) => d,

      // None => forgot to call fetch. Error.
      none: () => {
        Log.e("Requested events but did not call fetch first", q);
        return {
          eventsForRanges: [],
          isBusy: false,
          hasError: true
        };
      }
    });
  }

  // Use in sorting function to sort based on start, then end times
  export function sortFn(e1: Types.TeamEvent, e2: Types.TeamEvent) {
    let startDiff = e1.start.getTime() - e2.start.getTime();
    return startDiff != 0 ? startDiff :
           e1.end.getTime() - e2.end.getTime();
  }

  // Convert events for range to a single (sorted) list of unique events
  export function uniqueEvents(eventsForRanges: Types.EventsForRange[]) {
    let eventMap: {[index: string]: boolean} = {};
    let events: Types.TeamEvent[] = [];
    _.each(eventsForRanges, (range) => _.each(range.events, (event) => {
      let id = strId(event);
      if (! eventMap.hasOwnProperty(id)) {
        eventMap[id] = true;
        events.push(event);
      }
    }));

    events.sort(sortFn);
    return events;
  }


  //////

  export function fetchFuzzy(eventId: string, teamid?: string):
  JQueryPromise<ApiT.EventLookupResult> {
    return Api.getEventFuzzy(eventId, teamid).then((e) => {
      if (!e.result) {
        return null;
      }

      let teamId = e.result.teamid;
      let event = Option.wrap(asTeamEvent(teamId, e.result.event));
      EventStore.set({ teamId, eventId }, event);
      return e.result;
    });
  }

  export function fetchExact({teamId, calId, eventId}: {
    teamId: string;
    calId: string;
    eventId: string;
  }): JQueryPromise<Option.T<Types.TeamEvent>> {
    return EventStore.get({teamId, eventId}).match({
      none: () => Api.getEventExact(teamId, calId, eventId)
        .then((e) => {
          let event = Option.wrap(asTeamEvent(teamId, e));
          EventStore.set({teamId, eventId}, event);
          return event;
        }),
      some: (e) => $.Deferred().resolve(e.data).promise()
    })
  }


  /* Helpers */
  export var datesFromBounds = Period.datesFromBounds;

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
    return e1.teamId === e2.teamId &&
      (e1.recurringEventId ?
       e1.recurringEventId === e2.recurringEventId :
       e1.id === e2.id);
  }

  export function storeId(event: TeamEvent): FullEventId {
    return {
      teamId: event.teamId,
      eventId: event.id
    }
  }

  export function strId(event: TeamEvent, useRecurring = false): string {
    let id = useRecurring ? event.recurringEventId || event.id : event.id;
    return [event.teamId, id].join("|");
  }

  export function matchId(event: TeamEvent, storeId: FullEventId) {
    return event && storeId &&
      event.id === storeId.eventId &&
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
      (g) => g.response !== 'Declined' && optEmails.mapOr(true,
        (execEmails) => !_.includes(
          _.map(execEmails, (e) => e.toLowerCase()),
          (g.email || "").toLowerCase()
        )
      )
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

  export function getLabels(event: TeamEvent) {
    return event.labels.unwrapOr([]);
  }

  export function getLabelIds(event: TeamEvent) {
    return _.map(getLabels(event), (l) => l.id);
  }

  /*
    Does event count as a "new event" that user should confirm state of?
  */
  export function needsConfirmation(event: TeamEvent) {
    return !event.confirmed;
  }

  export function getTeams(events: TeamEvent[]) {
    // Get the team(s) for events
    return _(events)
      .map((e) => e.teamId)
      .uniq()
      .map((teamId) => Stores.Teams.require(teamId))
      .value();
  }

  /*
    "Active" event means we count it in time-stats. If the event's predicted
    active score is less than the thresholdb, we require explicit user
    action to make it active. Otherwise, it defaults to "active" unless
    the user marks it otherwise.
  */
  export function isActive(event: TeamEvent) {
    return !event.hidden;
  }

  /*
    Filters a list of events by text critiera -- we currently look at event
    title, description, and guest list. We can remove critieria if this is
    too CPU intensive.
   */
  export function filter(events: TeamEvent[], query: string): TeamEvent[] {
    return _.filter(events, (e) => filterOne(e, query));
  }

  export function filterOne(e: TeamEvent, query: string): boolean {
    query = query.toLowerCase();
    var title = e.title || "";
    var description = e.description || "";
    var guests = _.map(e.guests,
      (g) => g.display_name + " " + g.email
    );
    var labels = e.labels.mapOr([],
      (labels) => _.map(labels, (l) => l.displayAs));

    var filterText = [title, description]
                      .concat(guests)
                      .concat(labels)
                      .join(" ");
    filterText = filterText.toLowerCase();
    return _.includes(filterText, query);
  }


  interface EqOpts {
    deepCompare?: boolean;
    ignoreLabelScores?: boolean;
  }

  /*
    Quick-ish equality check of two event lists -- relies on most event
    objects being identical (frozen) to avoid doing too many deep equality
    checks.

    Opts:
      * deepCompare = true - Enable deep comparison between events that fail
        identity check.
      * ignoreLabelScores = false - Ignore different scores between labels.
        This can be used to avoid reacting to an event confirmation.
  */
  export function eqList(list1: Types.TeamEvent[],
                         list2: Types.TeamEvent[],
                         opts?: EqOpts)
  {
    // Extend defaults
    opts = _.extend({
      deepCompare: true,
      ignoreLabelScores: false
    }, opts || {})

    if (list1.length !== list2.length) return false;
    for (let i in list1) {
      let e1 = list1[i];
      let e2 = list2[i];
      if (e1 !== e2) {
        if (!opts.deepCompare || !e1 || !e2) return false;
        if (opts.ignoreLabelScores) {
          e1 = _.clone(e1);
          e1.confirmed = true;

          e2 = _.clone(e2);
          e2.confirmed = true;
        }
        if (! _.isEqual(e1, e2)) {
          return false;
        }
      }
    }
    return true;
  }

  export function eqRanges(range1: Types.EventsForRange[],
                           range2: Types.EventsForRange[],
                           opts?: EqOpts) {
    if (range1.length !== range2.length) return false;
    for (let i in range1) {
      let r1 = range1[i];
      let r2 = range2[i];
      if (! eqRange(r1.range, r2.range)) return false;
      if (! eqList(r1.events, r2.events, opts)) return false;
    }
    return true;
  }

  function eqRange(r1: [Date, Date], r2: [Date, Date]) {
    return r1[0].getTime() === r2[0].getTime() &&
           r1[1].getTime() === r2[1].getTime();
  }
}
