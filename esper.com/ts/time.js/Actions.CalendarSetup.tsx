/*
  Actions for calendar setup page
*/

module Esper.Actions {
  export function renderCalendarSetup() {

    // Open first team with no calendar, or just first team otherwise
    var team = _.find(Stores.Teams.all(),
      (t) => !t.team_timestats_calendars.length
    );
    var teamId = team ? team.teamid : Stores.Teams.firstId();

    // Trigger async -> does nothing if already loaded
    _.each(Stores.Teams.allIds(),
      (_id) => Stores.Calendars.fetchAvailable(_id));

    render(<Views.CalendarSetup teamId={teamId} />);
    Analytics.page(Analytics.Page.CalendarSetup, {
      teamId: teamId
    });
  }

}
