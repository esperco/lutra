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

        { this.renderCustomerList() }

        <div className="esper-panel-section">
          <ul className="esper-header esper-select-menu"><li>
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

    renderCustomerList() {
      let customers = _.filter(this.props.customers, (c) => !c.teamid);
      if (_.isEmpty(customers)) { return null; }

      // Only one customer, don't force user to pick
      if (customers.length === 1) {
        return <div className="esper-panel-section">
          <ul className="esper-header esper-select-menu">
            { this.renderCustomer(customers[0], Text.CustomerHeading) }
          </ul>
        </div>;
      }

      return <div className="esper-panel-section">
        <label className="esper-header">
          { Text.CustomerHeading }
        </label>
        <ul className="esper-select-menu">
          { _.map(customers, (c) => this.renderCustomer(c))}
        </ul>
      </div>;
    }

    renderCustomer(customer: ApiT.Customer, altName?: string) {
      // NB: Change Paths.Manage.Customer.accounts to general page when
      // general page actually has useful info
      var pathFn = this.props.cusId ? this.props.pathFn
                                    : Paths.Manage.Customer.accounts;

      return <li key={customer.id}>
        <a className={classNames({
          active: customer.id === this.props.cusId
        })}
        href={pathFn({cusId: customer.id}).href}>
          <i className="fa fa-fw fa-left fa-building" />
          { altName || Stores.Customers.getDisplayName(customer) }
        </a>
      </li>;
    }
  }
}
