/*
  A sidebar for selecting teams
*/
module Esper.Components {

  interface Props {
    activeTeamId: string;
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
        </ul>
      </Components.SidebarWithToggle>;
    }

    renderTeam(team: ApiT.Team) {
      return <li>
        <a className={classNames({
          active: team.teamid === this.props.activeTeamId
        })}
        href={Paths.Manage.team({teamId: team.teamid}).href}>
          <i className="fa fa-fw fa-user" />{" "}
          { team.team_name }
        </a>
      </li>;
    }
  }
}
