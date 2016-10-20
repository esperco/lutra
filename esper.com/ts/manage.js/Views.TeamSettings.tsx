/*
  Base class for a team settings view

  Override renderMain funciton
*/

module Esper.Views {
  // TeamID required
  interface Props extends Types.SettingsPageProps {
    teamId: string;
  }

  export abstract class TeamSettings<State>
         extends ReactHelpers.Component<Props, State> {
    pathFn: (p: {teamId: string}) => Paths.Path;

    renderWithData() {
      let team = Stores.Teams.require(this.props.teamId);
      if (! team) return <span />;

      let subMenu = <Components.SettingsMenu>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Team.general}>
          { Text.GeneralSettings }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Team.calendars}>
          { Text.Calendar }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Team.labels}>
          { Text.Labels }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Team.notifications}>
          { Text.NotificationSettings }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Team.pay}>
          { Text.PaySettings }
        </Components.SettingsMenuLink>
      </Components.SettingsMenu>;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        { this.renderMain(team) }
      </Views.Settings>
    }

    abstract renderMain(team: ApiT.Team): JSX.Element;
  }
}
