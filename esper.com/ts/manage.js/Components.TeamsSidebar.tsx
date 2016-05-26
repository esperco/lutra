/*
  A sidebar for selecting teams
*/
module Esper.Components {

  interface Props {
    activeTeamId?: string;
    activeGroupId?: string;
    pathFn?: (p: {teamId?: string, groupId?: string}) => Paths.Path;
    teams: ApiT.Team[];
    groups: ApiT.Group[];
  }

  export class TeamsSidebar extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Components.SidebarWithToggle>
        <div className="esper-sidebar-section">
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
        </div>
        <div className="esper-sidebar-section">
          <label className="esper-header">
            { Text.Groups }
          </label>
          <ul className="esper-select-menu">
            { _.map(this.props.groups, (g) => this.renderGroup(g))}
            <li className="divider" />
            <li>
              <a className={classNames({
                active: !this.props.activeGroupId
              })}
              href={Paths.Manage.newGroup().href}>
                <i className="fa fa-fw fa-user-plus" />{" "}
                { Text.AddGroupLink }
              </a>
            </li>
          </ul>
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

    renderGroup(group: ApiT.Group) {
      var pathFn = this.props.pathFn || Paths.Manage.Group.general;

      return <li key={group.groupid}>
        <a href={pathFn({groupId: group.groupid}).href}>
          <i className="fa fa-fw fa-users" />{" "}
          { group.group_name }
        </a>
      </li>;
    }
  }
}
