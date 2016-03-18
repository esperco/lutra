/// <reference path="./Views.CalendarSetup.tsx" />
/// <reference path="./Actions.tsx" />

module Esper.Actions {

  export function renderLabelManage(teamId?: string) {

    // Select default team if none provided
    if (! teamId) {
      teamId = Option.cast(
        _.find(Teams.all(), (t) => t.team_executive === Login.myUid())
      ).match({
        none: () => Teams.firstId(),
        some: (t) => t.teamid
      });
    }

    render(<Views.LabelManage teamId={teamId} />);
    Analytics.page(Analytics.Page.LabelManagement, {
      teamId: teamId
    });
  }

}
