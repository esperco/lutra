/*
  Base class for a team settings view

  Override renderMain funciton
*/

module Esper.Views {
  interface Props {
    teamId: string;
    msg?: string;
    err?: string;
  }

  export abstract class TeamSettings extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {teamId: string}) => Paths.Path;

    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      return <div className="team-settings-page esper-expanded">
        <Components.ManageSidebar
          activeTeamId={this.props.teamId}
          teams={Stores.Teams.all()}
          groups={Stores.Groups.all()}
          customers={Stores.Customers.all()}
          pathFn={this.pathFn}
        />

        <div className="esper-content">
          <Components.TeamSettingsMenu
            teamId={this.props.teamId}
            pathFn={this.pathFn}
          />

          <div className="esper-expanded">
            {
              this.props.msg ?
              <div className="alert msg alert-info">{ this.props.msg }</div> :
              null
            }
            {
              this.props.err ?
              <div className="alert msg alert-danger">{ this.props.err }</div> :
              null
            }
            { this.renderMain(team) }
          </div>
        </div>
      </div>;
    }

    abstract renderMain(team: ApiT.Team): JSX.Element;
  }
}
