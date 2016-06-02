/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="./Views.LabelSetup.tsx" />
/// <reference path="./Actions.tsx" />

module Esper.Actions {

  export function renderLabelSetup() {

    // Open first team with no labels, or just first team otherwise
    var team = _.find(Stores.Teams.all(), (t) => !t.team_labels_norm.length);
    var teamId = team ? team.teamid : Stores.Teams.firstId();

    render(<Views.LabelSetup teamId={teamId} />);
    Analytics.page(Analytics.Page.LabelSetup, {
      teamId: teamId
    });
  }

}
