/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="./Views.CalendarManage.tsx" />
/// <refernece path="./Actions" />

module Esper.Actions {
  export function renderCalendarManage(teamId?: string) {

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
    ApiC.getGenericCalendarList(teamId);

    render(<Views.CalendarManage teamId={teamId} />);
    Analytics.page(Analytics.Page.CalendarManage, {
      teamId: teamId
    });
  }

}
