/*
  Actions for single event page
*/

module Esper.Actions {
  // Render with App container
  export function render(main: React.ReactElement<any>) {
    Layout.render(<Views.App>
      { main }
    </Views.App>);
  }

  function getTeam() {
    // Default to exec team when fetching current event
    var allTeams = Stores.Teams.all();
    var team = _.find(allTeams, (t) => t.team_executive === Login.myUid()) ||
                      allTeams[0];
    if (! team) {
      Log.e("Missing team for fetching current event");
    }
    return team;
  }

  // Fetches the most recent (or ongoing event)
  function fetchEvents({teamId, date}: {
    teamId?: string;
    date?: Date;
  } = {}) {
    var team = teamId ? Stores.Teams.require(teamId) : getTeam();
    if (! team) { return; }

    // Fetch all events on date +/- 1 day
    var mDate = moment(date).startOf('day');
    return Stores.Events.fetchPredictions({
      teamId: team.teamid,
      period: Period.fromDates(
        "day",
        mDate.clone().subtract(1, 'day').toDate(),
        mDate.clone().add(1, 'day').toDate()
      )
    });
  }

  function getEvents({teamId, date}: {
    teamId?: string;
    date?: Date;
  } = {}) {
    var team = teamId ? Stores.Teams.require(teamId) : getTeam();
    if (! team) { return; }

    // Fetch all events on date +/- 1 day
    var mDate = moment(date).startOf('day');
    var events = Stores.Events.get({
      cals: _.map(team.team_timestats_calendars, (c) => ({
        teamId: team.teamid,
        calId: c
      })),
      period: Period.fromDates(
        "day",
        mDate.clone().subtract(1, 'day').toDate(),
        mDate.clone().add(1, 'day').toDate()
      )
    }).flatMap(
      (x) => Option.some(Stores.Events.uniqueEvents(x.eventsForRanges))
    ).unwrapOr([]);

    return _.sortBy(events, (e) => [
      e.start && e.start.getTime(),
      e.end && e.end.getTime()
    ]);
  }


  ////

  // Redirect to first (or last) event on a particular date
  export function goToDate(date: Date, opts?: {
    /*
      Going backwards? If false, start with event at beginning of date.
      Else, get event at end of date.
    */
    reverse?: boolean;

    /*
      If event if set, go to first event after this one. Or before if reverse
      is set. This param is here to help manage events that overlap date
      boundaries.
    */
    event?: Stores.Events.TeamEvent;

    teamId?: string;
  }) {
    opts = opts || {};
    let teamId = opts.teamId;
    var start = moment(date).startOf('day').toDate();
    var end = moment(date).endOf('day').toDate();
    var promise = fetchEvents({
      teamId, date: start
    });

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({
        teamId, date: date
      });
      var event = opts.reverse ?
        _.findLast(events, (e) =>
          !(opts.event && e.id === opts.event.id) &&
          e.start.getTime() <= end.getTime()) :
        _.find(events, (e) =>
          !(opts.event && e.id === opts.event.id) &&
          e.start.getTime() >= start.getTime());

      if (event) {
        goToEvent(event);
      } else {
        goToDatePage(date, teamId);
      }
    });
  }

  // Go to event after passed event
  export function goToNext(current: Stores.Events.TeamEvent) {
    var promise = fetchEvents({
      teamId: current.teamId, date: current.start
    });

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({
        teamId: current.teamId, date: current.start
      });

      var index = _.findIndex(events, (e) =>
        e.id === current.id &&
        e.calendarId === current.calendarId &&
        e.teamId === current.teamId
      );
      var nextEvent = events[index + 1];

      if (nextEvent) {
        goToEvent(nextEvent);
      }
      else {
        goToDate(
          moment(current.start).add(1, 'day').startOf('day').toDate(), {
            teamId: current.teamId,
            event: current
          });
      }
    });
  }

  // Go to event before passed event
  export function goToPrev(current: Stores.Events.TeamEvent) {
    var promise = fetchEvents({
      teamId: current.teamId, date: current.start
    });

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({
        teamId: current.teamId, date: current.start
      });

      var index = _.findIndex(events, (e) =>
        e.id === current.id &&
        e.calendarId === current.calendarId &&
        e.teamId === current.teamId
      );

      var prevEvent = events[index - 1];
      if (prevEvent) {
        goToEvent(prevEvent);
      }
      else {
        goToDate(
          moment(current.start).subtract(1, 'day').startOf('day').toDate(), {
            reverse: true,
            teamId: current.teamId,
            event: current
          });
      }
    });
  }

  // Render current event (or most recent event today if none ongoing)
  export function renderCurrent(teamId?: string) {
    var promise = fetchEvents({teamId});

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({teamId});
      var today = new Date();
      var now = today.getTime();

      // Events are sorted by start, end. Find last event with start < now
      // to get the "current" or most recent event of the day
      var currentEvent = _.findLast(events,
        (e) => e.start && e.start.getTime() < now);

      if (currentEvent) {
        renderEvent(currentEvent.id, {
          teamId: currentEvent.teamId,
          calId: currentEvent.calendarId
        });
      }

      else {
        renderDatePage(today, teamId);
      }
    });
  }


  ///////

  // Go to a specific event
  export function goToEvent(event: Stores.Events.TeamEvent) {
    Route.nav.go(Paths.Now.event({eventId: event.id}), {
      queryStr: $.param({
        team: event.teamId,
        cal: event.calendarId
      })
    });
  }

  /*
    Known event ID => fetch and render, optionally post action
  */
  export function renderEvent(eventId: string, {teamId, calId, action}: {
    teamId: string;
    calId: string;
    action?: ApiT.EventFeedbackAction;
  }) {
    if (!eventId) {
      Log.e("Missing eventId");
      Route.nav.go("/not-found");
    }

    // Bad team => try using a default team
    if (teamId && Stores.Teams.get(teamId).isNone()) {
      var team = getTeam();
      if (team.teamid !== teamId) {
        teamId = team.teamid;
      }
    }

    var p: JQueryPromise<Option.T<Types.TeamEvent>>;
    if (teamId && calId) {
      p = action ? Feedback.postActionAndFetch({
        teamId: teamId,
        calId: calId,
        eventId: eventId,
        action: action
      }) : Stores.Events.fetchExact({teamId, calId, eventId});
    } else {
      p = Stores.Events.fetchFuzzy(eventId).then((r) => {
        if (!r) {
          return Option.none();
        }

        teamId = r.teamid;
        calId = r.event.calendar_id;
        return Option.wrap(Stores.Events.asTeamEvent(teamId, r.event));
      });
    }

    render(<Components.PromiseSpinner promise={p} />);

    // Handle bad event IDs gracefully
    p.done(function(e) {
      if (e.isSome()) {
        render(<Views.EventView
          teamId={teamId}
          calId={calId}
          eventId={eventId}
          initAction={!!action}
        />);
      } else {
        Log.e("Event not found", {teamId, calId, eventId});
        Route.nav.go("/not-found");
      }
    }).fail(function() {
      Route.nav.go("/not-found");
    });

    Analytics.page(Analytics.Page.EventFeedback, {
      teamId: teamId,
      calId: calId,
      eventId: eventId,
      action: action
    });
  }


  ////

  /*
    Go to blank view for date with no events (ideally we just scan -- within
    reason -- until we find an event but that raises other issues to deal
    with)
  */
  export function goToDatePage(date: Date, teamId?: string) {
    Route.nav.go(Paths.Now.date({ date, teamId }));
  }

  // Render no-content view for a given date if no event on that date
  export function renderDatePage(date: Date, teamId: string) {
    render(<Views.DateView date={date} teamId={teamId} />);
  }
}
