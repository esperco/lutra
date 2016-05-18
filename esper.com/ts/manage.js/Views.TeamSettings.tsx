/*
  Base class for a team settings view

  Override renderMain funciton
*/

module Esper.Views {
  interface Props {
    teamId: string;
  }

  export abstract class TeamSettings extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      return <div className="team-settings-page esper-full-screen minus-nav">
        <Components.TeamsSidebar
          activeTeamId={this.props.teamId}
          teams={Stores.Teams.all()}
        />

        <div className="esper-right-content padded">
          <Components.SettingsMenu teamId={this.props.teamId} />
          <div className="esper-expanded">
            { this.renderMain(team) }
          </div>
        </div>
      </div>;
    }

    abstract renderMain(team: ApiT.Team): JSX.Element;
  }
}
