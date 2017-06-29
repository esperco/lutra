/// <reference path="./Views.TeamSetup.tsx" />
/// <reference path="./Actions.tsx" />

module Esper.Actions {
  export function renderTeamSetup() {
    render(<Views.TeamSetup />);
    Analytics.page(Analytics.Page.TeamSetup);
  }
}
