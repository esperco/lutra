/*
  Eventual replacement for the Events module
*/

/// <reference path="./Api.ts" />
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

  const PREDICTED_LABEL_PERCENT_CUTOFF = 0.5;
  const PREDICTED_ATTENDED_CUTOFF = 0.5;
  const PREDICTED_LABEL_MODIFIER = 0.95;

  export type TeamEvent = Types.TeamEvent;

  export function asTeamEvent(teamId: string, e: ApiT.GenericCalendarEvent)
    : TeamEvent
  {
    var labelScores = (() => {
      var hashtags =
        _(e.hashtags)
          .filter((h) => h.approved !== false)
          .map((h) => ({
            id: h.label_norm || h.hashtag_norm,
            displayAs: h.label || h.hashtag,
            score: 1
          }))
          .value();

      if (e.labels_norm) {
        let labels = _(e.labels_norm)
          .map((n, i) => {
            let [norm, display] = [n, e.labels[i]];
            Labels.storeMapping({ norm: norm, display: display });
            return {
              id: norm,
              displayAs: display,
              score: 1
            };
          })
          .unionBy(hashtags, (l) => l.id)
          .value();
        return Option.some(labels);
      } else if (!_.isEmpty(hashtags)) {
        return Option.some(hashtags);
      } else if (!_.isEmpty(e.predicted_labels)) {
        let team = Teams.require(teamId);
        if (team) {
          let labels = _.filter(e.predicted_labels,
            (l) => _.includes(team.team_labels_norm, l.label_norm));
          if (labels.length) {
            let labelsAboveThreshold = _(labels)
              .filter((l) => l.score >= PREDICTED_LABEL_PERCENT_CUTOFF)
              .map((l) => ({
                id: l.label_norm,
                displayAs: l.label,
                score: l.score * PREDICTED_LABEL_MODIFIER
              })).value();

            /*
              Only return Option.some if we have predicted labels above
              threshold. This helps us distinguish between an intentional
              user-selected empty set (Option.some([])) and a lack of
              predictions (Option.none).
            */
            if (labelsAboveThreshold.length)
              return Option.some(labelsAboveThreshold);
          }
        }
      }
      return Option.none<Labels.Label[]>();
    })();

    /*
      Use predicted_attended number if available. Else look to transparency.
      Presence of user labels should imply attended.
      Always override with direct user feedback.
    */
    let attendScore = _.isNumber(e.predicted_attended) ?
      e.predicted_attended : (e.transparent ? 0.1 : 0.9);
    if (e.labels || _.some(e.hashtags, (h) => h.approved || !!h.label_norm)) {
      attendScore = 1;
    }
    if (e.feedback && _.isBoolean(e.feedback.attended)) {
      attendScore = e.feedback.attended ? 1 : 0;
    }

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
      hashtags: e.hashtags,
      feedback: e.feedback || {
        notes: "", // Optional, but since we don't ever treat null notes
                   // differently than empty notes, default to blank string
                   // to avoid possible type errors
        teamid: teamId,
        eventid: e.id
      },
      location: e.location || "",
      allDay: e.all_day,
      guests: e.guests,
      attendScore: attendScore,
      recurringEventId: e.recurring_event_id
    };
  }


  /* Store Interfaces */

  export type FullEventId = Types.FullEventId;
  export type EventData = Model2.StoreData<FullEventId, TeamEvent>;
  export type EventListData = Types.EventListData;
  export type EventsForDate = Types.EventsForDate;
  export type EventDateData = Types.EventDateData;


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
      Event map by calendarId to date as stringified integer time
    */
    [index: string]: { [index: string]: TeamEvent[] }
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
        let calMap = eventMap[teamEvent.calendarId];
        if (! calMap) return;

        let dates = datesFromBounds(teamEvent.start, teamEvent.end);
        _.each(dates, (d) => {
          let key = d.getTime().toString();
          calMap[key] = calMap[key] || [];
          calMap[key].push(teamEvent);
        });
      });

      if (index < calendarEvents.length) {
        window.requestAnimationFrame(processEvents);
      } else {
        dfd.resolve(eventMap);
      }
    }

    // Make API call, then trigger batch function
    Api.postForTeamEvents(teamId, q).then((eventCollection) => {
      _.each(eventCollection, (events, calId) => {
        eventMap[calId] = {};
        calendarEvents = calendarEvents.concat(events.events);
      });
      processEvents();
    }, (err) => dfd.reject(err));

    return dfd.promise();
  }


  /* Helpers for switching between period and start/end forms */

  interface PeriodQ {
    period: Period.Single|Period.Custom,
  }
  interface StartEndQ {
    start: Date;
    end: Date;
  }
  type TimeQ = PeriodQ|StartEndQ;

  function withBounds<T, U>(q: T & TimeQ,
                            fn: (t: T & StartEndQ) => U): U {
    if (q.hasOwnProperty('period')) {
      var typedQ = <T & PeriodQ> q;
      var bounds = Period.boundsFromPeriod(typedQ.period);
      let p = <T & StartEndQ>
        _.extend({}, q, { start: bounds[0], end: bounds[1] })
      return fn(p);
    } else {
      let p = <T & StartEndQ> q;
      return fn(p);
    }
  }


  /* Predictions-based API */

  interface TeamQ {
    teamId: string;
    force?: boolean;
  }

  // Fetch predicts for team, return null promise when done
  export function fetchPredictions(q: TeamQ & TimeQ) {
    return withBounds(q, ({teamId, start, end, force=false}) => {

      // We store events by day, so make sure we fetch entire start / end
      start = moment(start).startOf('day').toDate();
      end = moment(end).endOf('day').toDate();

      var dates = datesFromBounds(start, end);
      var team = Stores.Teams.require(teamId);
      if (! team) return;

      var calIds = team.team_timestats_calendars;
      var doFetch = force || !!_.find(calIds, (calId) =>
        _.find(dates, (date) =>
          EventsForDateStore.get({
            calId: calId, teamId: teamId, date: date
          }).isNone()
        )
      );

      if (doFetch) {
        var apiP = fetchTeamEvents(teamId, {
          window_start: XDate.toString(start),
          window_end: XDate.toString(end)
        });

        EventsForDateStore.transact(() =>
          EventsForDateStore.transactP(apiP, (apiP2) =>
            EventStore.transactP(apiP2, (apiP3) => {
              _.each(calIds, (calId) => _.each(dates, (d) => {
                var dateP = apiP3.then((eventMap) => {
                  let calMap = eventMap[calId] || {};
                  let events = calMap[d.getTime().toString()] || [];
                  return Option.wrap(_.map(events,
                    (e): Model2.BatchVal<FullEventId, TeamEvent> => ({
                      itemKey: {
                        teamId: teamId,
                        calId: e.calendarId,
                        eventId: e.id
                      },
                      data: Option.some(e)
                    })));
                });

                EventsForDateStore.batchFetch({
                  teamId: teamId, calId: calId, date: d
                }, dateP);
              }))
            })
          )
        );

        return apiP.then(() => null);
      }

      return $.Deferred().resolve().progress();
    });
  }


  /* Get from store */

  interface CalsQ {
    cals: Stores.Calendars.CalSelection[];
  }

  export function get(q: CalsQ & TimeQ): Option.T<EventListData> {
    return withBounds(q, ({start, end, cals}) => {
      var dates = datesFromBounds(start, end);
      var eventsByDate = _.flatten(
        _.map(cals, (c) =>
          _.map(dates, (d) =>
            EventsForDateStore.batchGet({
              teamId: c.teamId,
              calId: c.calId,
              date: d
            })
          )
        )
      );

      // If any none, then all none
      if (_.find(eventsByDate, (e) => e.isNone())) {
        return Option.none<EventListData>();
      }

      // Events ready, de-deuplicate
      var events: TeamEvent[] = [];
      var eventExists: {[calIdEventId: string]: boolean} = {}; // De-dupe map
      var isBusy = false;
      var hasError = false;
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
            eventOpt.data.match({
              none: () => null,
              some: (event) => {
                let key = event.calendarId + event.id;
                if (! eventExists[key]) {
                  events.push(event);
                  eventExists[key] = true;
                }
              }
            });
          })
        });
      });

      return Option.some({
        start: start,
        end: end,
        events: events,
        isBusy: isBusy,
        hasError: hasError
      });
    });
  }

  // Overload require to take either period or start/end form
  export function require(q: CalsQ & TimeQ): EventListData {
    return withBounds(q, ({ start, end, cals }) => {
      // Assume start and end exist
      return get(q).match({
        some: (d) => d,

        // None => forgot to call fetch. Error.
        none: () => {
          Log.e("Requested events but did not call fetch first", q);
          return {
            start: start,
            end: end,
            events: <TeamEvent[]> [],
            isBusy: false,
            hasError: true
          };
        }
      });
    });
  }


  /////

  export function getByDate(q: CalsQ & TimeQ): Option.T<EventDateData> {
    return withBounds(q, ({ start, end, cals }) => {
      var dates = datesFromBounds(start, end);
      var isBusy = false;
      var hasError = false;
      var eventDates: {
        date: Date;
        events: TeamEvent[]
      }[] = [];

      for (let i in dates) {
        let date = dates[i];
        let events = Option.flatOpt(
          _.map(cals, (c) => EventsForDateStore.batchGet({
            teamId: c.teamId,
            calId: c.calId,
            date: date
          }))
        );

        if (events.isNone()) {
          return Option.none<EventDateData>();
        } else {
          let eventsForThisDay: TeamEvent[] = [];
          _.each(Option.matchList(events), (e) => {
            // If date is busy or error, then entire list is busy or error
            if (e.dataStatus === Model2.DataStatus.FETCHING) {
              isBusy = true;
            } else if (e.dataStatus === Model2.DataStatus.FETCH_ERROR) {
              hasError = true;
            }

            _.each(Option.matchList(e.data), (eventOpt) => {
              // If event is busy or error, then entire list is busy or error
              if (eventOpt.dataStatus === Model2.DataStatus.FETCHING) {
                isBusy = true;
              }
              else if (eventOpt.dataStatus ===
                       Model2.DataStatus.FETCH_ERROR) {
                hasError = true;
              }
              eventOpt.data.match({
                none: () => null,
                some: (event) => eventsForThisDay.push(event)
              })
            });
          });

          eventDates.push({
            date: date,
            events: eventsForThisDay
          });
        }
      }

      return Option.some({
        hasError: hasError,
        isBusy: isBusy,
        dates: eventDates
      });
    });
  }

  export function requireByDate(q: CalsQ & TimeQ): EventDateData {
    return withBounds(q, ({ start, end, cals }) => {
      // Assume start and end exist
      return getByDate(q).match({
        some: (d) => d,

        // None => forgot to call fetch. Error.
        none: () => {
          Log.e("Requested events by date but did not call fetch first");
          return {
            dates: [],
            isBusy: false,
            hasError: true
          };
        }
      });
    });
  }


  //////

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

  export function strId(event: TeamEvent): string {
    return [event.teamId, event.calendarId, event.id].join("|");
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

  /*
    Event needs confirmation if scores are between 0 and 1 and if active.
    For the purpose of determing active, we look towards actual user
    confirmation. If we predicted an event to active
  */
  export function needsConfirmation(event: TeamEvent) {
    return event.labelScores.match({
      none: () => true, // No labels, let user confirm empty set
      some: (labels) => _.some(labels, (l) => l.score > 0 && l.score < 1)
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

  /*
    "Active" event means we count it in time-stats. If the event's predicted
    active score is less than the thresholdb, we require explicit user
    action to make it active. Otherwise, it defaults to "active" unless
    the user marks it otherwise.
  */
  export function isActive(event: TeamEvent) {
    return event.attendScore >= PREDICTED_ATTENDED_CUTOFF;
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
    var labels = e.labelScores.match({
      none: (): string[] => [],
      some: (scores) => _.map(scores, (l) => l.displayAs)
    });

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
  export function eqList(list1: Stores.Events.TeamEvent[],
                         list2: Stores.Events.TeamEvent[],
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
          reviseScores(e1);

          e2 = _.clone(e2);
          reviseScores(e2);
        }
        if (! _.isEqual(e1, e2)) {
          return false;
        }
      }
    }
    return true;
  }

  // Bumps all predictions up to 1
  function reviseScores(event: TeamEvent) {
    event.labelScores = event.labelScores && event.labelScores.flatMap(
      (scores) => Option.some(_.map(scores, (s) => ({
        id: s.id,
        displayAs: s.displayAs,
        score: 1
      })))
    );
  }

  export function eqEventsForDate(list1: EventsForDate[],
                                  list2: EventsForDate[],
                                  opts?: EqOpts) {
    if (list1.length !== list2.length) return false;
    for (var i in list1) {
      let d1 = list1[i];
      let d2 = list2[i];
      if (d1.date.getTime() !== d2.date.getTime() ||
          !eqList(d1.events, d2.events, opts)) {
        return false;
      }
    }
    return true;
  }
}
