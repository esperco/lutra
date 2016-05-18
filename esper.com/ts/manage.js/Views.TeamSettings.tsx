/*
  Generic view with settings for each team
*/

module Esper.Views {
  interface Props {
    teamId: string;
  }

  export class TeamSettings extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      var busy = Stores.Teams.status(this.props.teamId).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.INFLIGHT
      });
      var error = Stores.Teams.status(this.props.teamId).match({
        none: () => true,
        some: (d) => d === Model2.DataStatus.PUSH_ERROR
      });

      var exec = Stores.Profiles.get(team.team_executive);
      var prefs = Stores.Preferences.get(team.teamid)
        .flatMap((p) => Option.some(p.general));

      return <div id="team-settings-page"
                  className="esper-full-screen minus-nav">
        <Components.TeamsSidebar
          activeTeamId={this.props.teamId}
          teams={Stores.Teams.all()}
        />

        <div className="esper-right-content padded"><div>

          {/* Team Info */}
          <Components.TeamInfo exec={exec} prefs={prefs} team={team} />

          {/* Labels */}
          <div className="panel panel-default">
            <div className="panel-heading">
              { Text.Labels }
            </div>
            <div className="panel-body">
              <Components.LabelManager team={team} />
            </div>
          </div>

        </div></div>
      </div>;
    }
  }
}
