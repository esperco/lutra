/*
  A sidebar for selecting teams
*/
module Esper.Components {

  interface Props {
    activeTeamId?: string;
    teams: ApiT.Team[];
  }

  export class TeamsSidebar extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Components.SidebarWithToggle>
        <label className="esper-header">
          { Text.TeamExecs }
        </label>
        <ul className="esper-select-menu">
          { _.map(this.props.teams, (t) => this.renderTeam(t))}
          <li className="divider" />
          <li>
            <a className={classNames({
              active: !this.props.activeTeamId
            })}
            href={Paths.Manage.newTeam().href}>
              <i className="fa fa-fw fa-user-plus" />{" "}
              { Text.AddTeamLink }
            </a>
          </li>
        </ul>
      </Components.SidebarWithToggle>;
    }

    renderTeam(team: ApiT.Team) {
      return <li key={team.teamid}>
        <a className={classNames({
          active: team.teamid === this.props.activeTeamId
        })}
        href={Paths.Manage.general({teamId: team.teamid}).href}>
          <i className="fa fa-fw fa-user" />{" "}
          { team.team_name }
        </a>
      </li>;
    }
  }
}
