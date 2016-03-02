/// <reference path="./Views.CalendarSetup.tsx" />

module Esper.Actions {

  export function CalendarSetup(teamId?: string) {
    // Trigger async -> does nothing if already loaded
    ApiC.getGenericCalendarListOfUser();

    // Select default team if none provided
    if (! teamId) {
      teamId = Option.cast(
        _.find(Teams.all(), (t) => t.team_executive === Login.myUid())
      ).match({
        none: () => Teams.firstId(),
        some: (t) => t.teamid
      });
    }

    return <Views.CalendarSetup teamId={teamId} />;
  }

}
