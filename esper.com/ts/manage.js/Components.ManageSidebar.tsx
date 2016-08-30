/*
  A sidebar for managing teams, groups and personal preferences
*/
module Esper.Components {

  interface Props {
    activeTeamId?: string;
    activeGroupId?: string;
    pathFn?: (p: {teamId?: string, groupId?: string}) => Paths.Path;
    teams: ApiT.Team[];
    activePersonal?: boolean;
    newTeam?: boolean;
    newGroup?: boolean;
    groups: ApiT.Group[];
  }

  export class ManageSidebar extends ReactHelpers.Component<Props, {}> {
    render() {
      return <Components.Sidebar side="left" className="esper-shade">
        <div className="esper-panel-section">
          <label className="esper-header">
            { Text.TeamExecs }
          </label>
          { this.props.teams.length ?
            <ul className="esper-select-menu">
              { _.map(this.props.teams, (t) => this.renderTeam(t))}
            </ul> : null }
          <ul className="esper-select-menu">
            <li>
              <a className={classNames({
                active: this.props.newTeam
              })}
              href={Paths.Manage.newTeam().href}>
                <i className="fa fa-fw fa-user-plus" />{" "}
                { Text.AddTeamLink }
              </a>
            </li>
          </ul>
        </div>

        <div className="esper-panel-section">
          <label className="esper-header">
            { Text.Groups }
          </label>
          <ul className="esper-select-menu">
            { _.map(this.props.groups, (g) => this.renderGroup(g))}
          </ul>
          <ul className="esper-select-menu">
            <li>
              <a className={classNames({
                active: this.props.newGroup
              })}
              href={Paths.Manage.newGroup().href}>
                <i className="fa fa-fw fa-user-plus" />{" "}
                { Text.AddGroupLink }
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
      </Components.Sidebar>;
    }

    renderTeam(team: ApiT.Team) {
      // Use pathFn to preserve current settings "tab" when switching teams
      var pathFn = this.props.activeTeamId ? this.props.pathFn
                                           : Paths.Manage.Team.general;

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
      var pathFn = this.props.activeGroupId ? this.props.pathFn
                                            : Paths.Manage.Group.general;

      return <li key={group.groupid}>
        <a className={classNames({
          active: group.groupid === this.props.activeGroupId
        })}
        href={pathFn({groupId: group.groupid}).href}>
          <i className="fa fa-fw fa-users" />{" "}
          { group.group_name }
        </a>
      </li>;
    }
  }
}
