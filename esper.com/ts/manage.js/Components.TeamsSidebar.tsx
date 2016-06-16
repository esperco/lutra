/*
  A sidebar for selecting teams
*/
module Esper.Components {

  interface Props {
    activeTeamId?: string;
    pathFn?: (p: {teamId: string}) => Paths.Path;
    teams: ApiT.Team[];
    activePersonal?: boolean;
  }

  export class TeamsSidebar extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Components.SidebarWithToggle>
        <div className="esper-panel-section">
          <label className="esper-header">
            { Text.TeamExecs }
          </label>
          <ul className="esper-select-menu">
            { _.map(this.props.teams, (t) => this.renderTeam(t))}
            <li className="divider" />
            <li>
              <a className={classNames({
                active: !this.props.activeTeamId && !this.props.activePersonal
              })}
              href={Paths.Manage.newTeam().href}>
                <i className="fa fa-fw fa-user-plus" />{" "}
                { Text.AddTeamLink }
              </a>
            </li>
          </ul>
        </div>

        <div className="esper-panel-section">
          <ul className="esper-select-menu"><li>
            <a className={classNames({
              active: this.props.activePersonal
            })} href={Paths.Manage.personal().href}>
              <i className="fa fa-fw fa-cog" />{" "}
              { Text.PersonalSettings }
            </a>
          </li></ul>
        </div>
      </Components.SidebarWithToggle>;
    }

    renderTeam(team: ApiT.Team) {
      // Use pathFn to preserve current settings "tab" when switching teams
      var pathFn = this.props.pathFn || Paths.Manage.Team.general;

      return <li key={team.teamid}>
        <a className={classNames({
          active: team.teamid === this.props.activeTeamId
        })}
        href={pathFn({teamId: team.teamid}).href}>
          <i className="fa fa-fw fa-user" />{" "}
          { team.team_name }
        </a>
      </li>;
    }
  }
}
