/*
  Actions for single event page
*/

module Esper.Actions {

  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header />;
    }
    Layout.render(main, header, footer);
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
      start: mDate.clone().subtract(1, 'day').toDate(),
      end: mDate.clone().add(1, 'day').toDate()
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
    var events: Stores.Events.TeamEvent[] = [];
    _.each(team.team_timestats_calendars, (calId) => {
      Stores.Events.get({
        teamId: team.teamid,
        calId: calId,
        start: mDate.clone().subtract(1, 'day').toDate(),
        end: mDate.clone().add(1, 'day').toDate()
      }).match({
        none: () => null,
        some: (e) => events = events.concat(e.events)
      });
    });
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
    var start = moment(date).startOf('day').toDate();
    var end = moment(date).endOf('day').toDate();
    var promise = fetchEvents({
      teamId: opts.teamId, date: start
    });

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({
        teamId: opts.teamId, date: date
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
        goToDatePage(date);
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

  // Go to current event (or most recent event today if none ongoing)
  export function goToCurrent(teamId?: string) {
    var promise = fetchEvents({teamId: teamId});

    render(<Components.PromiseSpinner promise={promise} />);

    promise.done(function() {
      var events = getEvents({teamId: teamId});
      var today = new Date();
      var now = today.getTime();

      // Events are sorted by start, end. Find last event with start < now
      // to get the "current" or most recent event of the day
      var currentEvent = _.findLast(events,
        (e) => e.start && e.start.getTime() < now);

      if (currentEvent) {
        goToEvent(currentEvent);
      }

      else {
        goToDatePage(today);
      }
    });
  }


  ///////

  // Go to a specific event
  export function goToEvent(event: Stores.Events.TeamEvent) {
    Route.nav.go(Paths.Now.event(), {
      queryStr: $.param({
        team: event.teamId,
        cal: event.calendarId,
        event: event.id
      })
    });
  }

  /*
    Known event ID => fetch and render, optionally post action
  */
  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action?: ApiT.EventFeedbackAction;
  }) {
    if (!eventId || !teamId || !calId) {
      Log.e(`Missing params - ${eventId} - ${teamId} - ${calId}`);
    }

    var p = action ?
      Feedback.postActionAndFetch({
        teamId: teamId,
        calId: calId,
        eventId: eventId,
        action: action
      }) : Stores.Events.fetchOne({
        teamId: teamId,
        calId: calId,
        eventId: eventId
      });

    render(<Components.PromiseSpinner promise={p} />);

    // Handle bad event IDs gracefully
    p.done(function(e) {
      if (e.isNone()) {
        Log.e(e);
        Route.nav.go("/not-found");
      }
    }).fail(function(err) {
      Log.e(err);
      Route.nav.go("/not-found");
    })

    render(<Views.EventView
      teamId={teamId}
      calId={calId}
      eventId={eventId}
      initAction={!!action}
    />);

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
  export function goToDatePage(date: Date) {
    Route.nav.go(Paths.Now.date({ date: date }));
  }

  // Render no-content view for a given date if no event on that date
  export function renderDatePage(date: Date) {
    render(<Views.Date date={date} />);
  }
}