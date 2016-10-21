/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.pay;

    renderMain(team: ApiT.Team) {
      let subscription = team.team_api.team_subscription;
      let subBusy = Stores.Subscriptions.status(subscription.cusid).match({
        none: () => false,
        some: (d) => d === Model2.DataStatus.FETCHING
      });
      let custBusy = !Stores.Customers.ready();
      if (subBusy || custBusy) {
        return <div className="esper-spinner" />;
      }

      return Stores.Customers.get(subscription.cusid).match({

        // Enterprise customer that logged in user can't access
        none: () => this.renderEnterpriseCustomer(),

        some: (c) => !!c.teamid ?

          // Team customer
          <div>
            { this.renderTeamCustomer(team) }
            { this.renderAddToEnterprise(team) }
          </div> :

          // Enterprise customer that logged in user can access
          this.renderEnterpriseCustomer(c)
      });
    }

    renderTeamCustomer(team: ApiT.Team) {
      let subscription = team.team_api.team_subscription;
      let details = Stores.Subscriptions.require(subscription.cusid);

      return <div className="panel panel-default"><div className="panel-body">
        { subscription.active ?
          <div className="alert alert-info">
            { Text.SubscribedToPlan(team.team_name, subscription.plan) }
          </div>
          : ( subscription.status === "Canceled" ?
          <div className="alert alert-danger">
            { Text.SubscriptionExpired }{" "}{ Text.SelectToRenew }
          </div>
          :
          <div className="alert alert-warning">
            { Text.NoPlan }{" "}{ Text.SelectToRenew }
          </div> )}

        <div className="esper-section">
          <Components.Plans subscription={details} />
          { details.active ?
            <Components.CreditCardList subscription={details} /> :
            null }
        </div>
      </div></div>;
    }

    // Render link to enterprise customer management
    renderEnterpriseCustomer(customer?: ApiT.Customer) {
      return <div className="panel panel-default"><div className="panel-body">
        { customer ?

          <span>
            { Text.EnterpriseMsg }{" "}
            <a href={Paths.Manage.Customer.accounts({
              cusId: customer.id
            }).href}>{ Text.GoToEnterpriseBilling }</a>
          </span> :

          Text.CustomerNoPermission
        }
      </div></div>;
    }

    // Allow user to convert team accounts into enterprise by sending email
    renderAddToEnterprise(team: ApiT.Team) {
      let subscription = team.team_api.team_subscription;
      let enterpriseCustomers = _.filter(Stores.Customers.all(),
        (c) => !c.teamid
      );

      // Only render input if not already enterprise account
      return Stores.Customers.get(subscription.cusid).match({
        none: () => null,
        some: (c) => !!c.teamid ?
          <div className="panel panel-default">
            <div className="panel-heading">
              <h4 className="description-header">
                { Text.AddToEnterpriseHeading }
              </h4>
              <div className="description">
                { Text.AddToEnterpriseDescription }
                { _.isEmpty(enterpriseCustomers) ? null :
                  " " + Text.AddToExistingEnterpriseDescription
                }
              </div>
            </div>
            <div className="panel-body">
              { _.isEmpty(enterpriseCustomers) ? null :
                <div className="esper-section esper-full-width">
                  <div className="esper-select-menu">
                    { _.map(enterpriseCustomers, (c) =>
                      <div key={c.id} className="esper-selectable" onClick={
                        () => Actions.Customers.acceptSeat(c.id, team.teamid)
                      }>
                        <i className="fa fa-fw fa-left fa-plus" />
                        { Text.AddToEnterprise(
                          enterpriseCustomers.length === 1 ?
                            Text.OnlyOneEnterpriseCustomer :
                            Stores.Customers.getDisplayName(c)) }
                      </div>
                    )}
                  </div>
                </div>
              }
              <div className="esper-section">
                <label>{ Text.BillingContactLabel }</label>
                <Components.EmailInput onSubmit={
                  (email) => Actions.Customers.addTeamByEmail(c.teamid, email)}
                  successMsg={Text.BillingContactSuccess}
                />
              </div>
            </div>
          </div> : null
      });
    }
  }
}
