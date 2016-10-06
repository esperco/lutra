/*
  A sidebar for managing teams, groups and personal preferences
*/
module Esper.Components {

  interface Props {
    // Active team, group, or customer
    teamId?: string;
    groupId?: string;
    cusId?: string;

    // Current path
    pathFn: (p: {
      teamId?: string,
      groupId?: string,
      cusId?: string
    }) => Paths.Path;
    teams: ApiT.Team[];
    groups: ApiT.Group[];
    customers: ApiT.Customer[];
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
                active: this.props.pathFn === Paths.Manage.newTeam
              })}
              href={Paths.Manage.newTeam().href}>
                <i className="fa fa-fw fa-left fa-user-plus" />
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
                active: this.props.pathFn === Paths.Manage.newGroup
              })}
              href={Paths.Manage.newGroup().href}>
                <i className="fa fa-fw fa-left fa-user-plus" />
                { Text.AddGroupLink }
              </a>
            </li>
          </ul>
        </div>

        <div className="esper-panel-section">
          <ul className="esper-select-menu"><li>
            <a className={classNames({
              active: this.props.pathFn === Paths.Manage.personal
            })} href={Paths.Manage.personal().href}>
              <i className="fa fa-fw fa-left fa-cog" />
              { Text.PersonalSettings }
            </a>
          </li></ul>
        </div>
      </Components.Sidebar>;
    }

    renderTeam(team: ApiT.Team) {
      // Use pathFn to preserve current settings "tab" when switching teams
      var pathFn = this.props.teamId ? this.props.pathFn
                                     : Paths.Manage.Team.general;
      return <li key={team.teamid}>
        <a className={classNames({
          active: team.teamid === this.props.teamId
        })}
        href={pathFn({teamId: team.teamid}).href}>
          <i className="fa fa-fw fa-left fa-user" />
          { team.team_name }
        </a>
      </li>;
    }

    renderGroup(group: ApiT.Group) {
      var pathFn = this.props.groupId ? this.props.pathFn
                                      : Paths.Manage.Group.general;

      return <li key={group.groupid}>
        <a className={classNames({
          active: group.groupid === this.props.groupId
        })}
        href={pathFn({groupId: group.groupid}).href}>
          <i className="fa fa-fw fa-left fa-users" />
          { group.group_name }
        </a>
      </li>;
    }

    // TODO: Actually insert function into sidebar when ready
    renderCustomer(customer: ApiT.Customer) {
      var pathFn = this.props.cusId ? this.props.pathFn
                                    : Paths.Manage.Customer.general;

      return <li key={customer.id}>
        <a className={classNames({
          active: customer.id === this.props.cusId
        })}
        href={pathFn({cusId: customer.id}).href}>
          <i className="fa fa-fw fa-left fa-building" />
          { Stores.Customers.getDisplayName(customer) }
        </a>
      </li>;
    }
  }
}
