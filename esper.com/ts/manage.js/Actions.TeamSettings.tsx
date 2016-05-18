module Esper.Actions {
  export function renderTeamSettings(teamId?: string) {
    var teamId = Params.cleanTeamId(teamId);
    render(<Views.TeamSettings teamId={teamId} />);
    Analytics.page(Analytics.Page.TeamManage);
  }
}
