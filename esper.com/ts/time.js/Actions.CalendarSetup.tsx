/// <reference path="./Views.CalendarSetup.tsx" />
/// <refernece path="./Actions" />

module Esper.Actions {

  export function renderCalendarSetup(teamId?: string) {

    // Select default team if none provided
    if (! teamId) {
      teamId = Option.cast(
        _.find(Teams.all(), (t) => t.team_executive === Login.myUid())
      ).match({
        none: () => Teams.firstId(),
        some: (t) => t.teamid
      });
    }

    // Trigger async -> does nothing if already loaded
    ApiC.getGenericCalendarList(teamId);

    render(<Views.CalendarSetup teamId={teamId} />);
    Analytics.page(Analytics.Page.CalendarSetup, {
      teamId: teamId
    });
  }

}
