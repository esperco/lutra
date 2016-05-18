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

      return <div id="team-settings-page"
                  className="esper-full-screen minus-nav">
        <Components.TeamsSidebar
          activeTeamId={this.props.teamId}
          teams={Stores.Teams.all()}
        />

        <div className="esper-right-content padded">

          {/* Labels */}
          <div className="panel panel-default">
            <div className="panel-heading">
              { Text.Labels }
            </div>
            <div className="panel-body">
              <Components.LabelManager team={team} />
            </div>
          </div>

        </div>
      </div>;
    }
  }
}
