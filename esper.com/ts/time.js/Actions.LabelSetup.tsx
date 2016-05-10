/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="./Views.LabelSetup.tsx" />
/// <reference path="./Actions.tsx" />

module Esper.Actions {

  export function renderLabelSetup(teamId?: string) {

    // Select default team if none provided
    teamId = teamId || Stores.Teams.firstId();

    render(<Views.LabelSetup teamId={teamId} />);
    Analytics.page(Analytics.Page.LabelSetup, {
      teamId: teamId
    });
  }

}
