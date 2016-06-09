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
  export function fetchCurrentEvents() {
    var team = getTeam();
    if (! team) { return; }

    // Fetch all events yesterday, today, and tomorrow
    var today = moment().startOf('day');
    Stores.Events.fetchPredictions({
      teamId: team.teamid,
      start: today.clone().subtract(1, 'day').toDate(),
      end: today.clone().add(1, 'day').toDate()
    });
  }

  export function getCurrentEvents() {
    var team = getTeam();
    if (! team) { return; }

    var today = moment().startOf('day');
    var events: Stores.Events.TeamEvent[] = [];
    _.each(team.team_timestats_calendars, (calId) => {
      Stores.Events.get({
        teamId: team.teamid,
        calId: calId,
        start: today.clone().subtract(1, 'day').toDate(),
        end: today.clone().add(1, 'day').toDate()
      }).match({
        none: () => null,
        some: (e) => events = events.concat(e.events)
      });
    });
    return _.sortBy(events, (e) => [e.start, e.end]);
  }

  export function getNextEvent(current: Stores.Events.TeamEvent) {

  }

  export function getPrevEvent(current: Stores.Events.TeamEvent) {

  }

  export function renderEvent({teamId, calId, eventId, action}: {
    teamId: string;
    calId: string;
    eventId: string;
    action?: ApiT.EventFeedbackAction;
  }) {
    if (!eventId) { return; }

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

    // Handle bad event IDs gracefully
    p.done(function(e) {
      if (e.isNone()) {
        Route.nav.home();
      }
    }).fail(function() {
      Route.nav.home();
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
}
