/*
  Base class for a team settings view

  Override renderMain funciton
*/

module Esper.Views {
  // TeamID required
  interface Props extends Types.SettingsPageProps {
    teamId: string;
  }

  export abstract class TeamSettings
         extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {teamId: string}) => Paths.Path;

    renderWithData() {
      let team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      let subMenu = <Components.TeamSettingsMenu
        teamId={this.props.teamId}
        pathFn={this.pathFn}
      />;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        { this.renderMain(team) }
      </Views.Settings>
    }

    abstract renderMain(team: ApiT.Team): JSX.Element;
  }
}
