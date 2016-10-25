/*
  Refactored widget for requesting payments
*/

/// <reference path="./Actions.Customers.ts" />
/// <reference path="./Components.CreditCardList.tsx" />
/// <reference path="./Components.EmailInput.tsx" />
/// <reference path="./Components.Plans.tsx" />
/// <reference path="./Paths.ts" />
/// <reference path="./Text.tsx" />

module Esper.Components {
  interface Props {
    team: ApiT.Team;

    // All the customers logged in user has access to -- used for adding to
    // an existing enterprise team
    customers: ApiT.Customer[];

    // Subscription details, if available -- if no details, we assume this
    // is an enterprise customer
    details?: ApiT.SubscriptionDetails;
  }

  export function PaymentInfo(props: Props) {
    let subscription = props.team.team_api.team_subscription;
    let customer = _.find(props.customers,
      (c) => c.id === subscription.cusid
    );

    if (customer && !!customer.teamid) {
      return <div>
        <TeamCustomer {...props} />
        <AddToEnterprise {...props} />
      </div>;
    }

    else {
      return <EnterpriseCustomer customer={customer} />;
    }
  }

  export function TeamCustomer({team, details}: Props) {
    let subscription = team.team_api.team_subscription;
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

  export function AddToEnterprise({team, customers, details}: Props) {
    let enterpriseCustomers = _.filter(Stores.Customers.all(),
      (c) => !c.teamid
    );

    return <div className="panel panel-default">
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
            (email) => Actions.Customers.addTeamByEmail(team.teamid, email)}
            successMsg={Text.BillingContactSuccess}
          />
        </div>
      </div>
    </div>;
  }

  export function EnterpriseCustomer({customer}: {customer?: ApiT.Customer}) {
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
}
