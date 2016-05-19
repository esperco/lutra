/*
  Actions for calendar setup page
*/

module Esper.Actions {
  export function renderCalendarSetup(teamId?: string) {

    // Select default team if none provided
    if (! teamId) {
      teamId = Option.cast(
        _.find(Stores.Teams.all(), (t) => t.team_executive === Login.myUid())
      ).match({
        none: () => Stores.Teams.firstId(),
        some: (t) => t.teamid
      });
    }

    // Trigger async -> does nothing if already loaded
    _.each(Stores.Teams.allIds(),
      (_id) => Stores.Calendars.fetchAvailable(_id));

    render(<Views.CalendarSetup teamId={teamId} />);
    Analytics.page(Analytics.Page.CalendarSetup, {
      teamId: teamId
    });
  }

}
