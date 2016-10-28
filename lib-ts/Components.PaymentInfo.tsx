/*
  Component for displaying plans + enterprise biling
*/

/// <reference path="./Actions.Customers.ts" />
/// <reference path="./Components.EmailInput.tsx" />
/// <reference path="./Components.Plans.tsx" />
/// <reference path="./Stripe.ts" />
/// <reference path="./Text.tsx" />
/// <reference path="./Types.ts" />

module Esper.Components {
  interface Props {
    team: ApiT.Team;
    stripeKey: string;

    // Initial description, if any
    description?: string|JSX.Element|JSX.Element[];

    // All the customers logged in user has access to -- used for adding to
    // an existing enterprise team
    customers?: ApiT.Customer[];

    // Subscription details, if available -- if no details, we assume this
    // is an enterprise customer
    details?: ApiT.SubscriptionDetails;

    // Post plan selection redirect
    redirect?: string|Paths.Path;
  }

  interface State {
    showBillingEmail: boolean;
  }

  export class PaymentInfo extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { showBillingEmail: false };
    }

    render() {
      let cusId = this.props.team.team_api.team_subscription.cusid;
      let activeCust = _.find(this.props.customers, (c) => c.id === cusId);

      // Team customer
      if (activeCust && !!activeCust.teamid) {
        return this.state.showBillingEmail ?
          this.renderBillingEmail() :
          this.renderPlans();
      }

      // Enterprise customer, just link
      return <div className="panel panel-default">
        <div className="panel-heading">
          <h4 className="description-header">
            { Text.SelectPlanHeader }
          </h4>
          {
            this.props.description ?
            <div className="description">
              { this.props.description }
            </div> : null
          }
        </div>
        <div className="panel-body">
          { this.renderStatus() }
          { activeCust ?

            <span>
              { Text.EnterpriseMsg }{" "}
              <a href={Paths.Manage.Customer.accounts({ cusId }).href}>
                { Text.GoToEnterpriseBilling }
              </a>
            </span> :

            Text.CustomerNoPermission }
        </div>
      </div>;
    }

    renderPlans() {
      return <div className="panel panel-default">
        <div className="panel-heading">
          <h4 className="description-header">
            { Text.SelectPlanHeader }
          </h4>
          {
            this.props.description ?
            <div className="description">
              { this.props.description }
            </div> : null
          }
        </div>
        <div className="panel-body">
          { this.renderStatus() }
          <Plans
            subscription={this.props.team.team_api.team_subscription}
            plans={Text.AllPlans}
            onSelect={(plan) => this.onSelect(plan)}
          />
          <div className="text-center esper-section" onClick={
            () => this.mutateState((s) => s.showBillingEmail = true)}
          >
            <a>{ Text.AddToEnterpriseLink }</a>
          </div>
        </div>
      </div>;
    }

    renderBillingEmail() {
      let enterpriseCustomers = _.filter(this.props.customers,
        (c) => !c.teamid
      );
      let teamId = this.props.team.teamid;

      return <div className="panel panel-default">
        <div className="panel-heading">
          <h4 className="description-header">
            <a className="action back-action" onClick={() => this.onBack()}>
              <i className="fa fa-fw fa-left fa-arrow-circle-left" />
            </a>
            { Text.AddToEnterpriseHeading }
          </h4>
          <div className="description">
            { Text.AddToEnterpriseDescription }
          </div>
        </div>
        <div className="panel-body">
          { _.isEmpty(enterpriseCustomers) ? null :
            <div className="esper-section esper-full-width">
              <div className="esper-select-menu">
                { _.map(enterpriseCustomers, (c) =>
                  <div key={c.id} className="esper-selectable" onClick={
                    () => Actions.Customers.acceptSeat(c.id, teamId)
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
              (email) => Actions.Customers.addTeamByEmail(teamId, email)}
              successMsg={Text.BillingContactSuccess}
            />
          </div>
        </div>
      </div>;
    }

    renderStatus() {
      let team = this.props.team;
      let subscription = team.team_api.team_subscription;
      if (subscription.active) {
        return <div className="alert alert-info">
          { Text.SubscribedToPlan(team.team_name, subscription.plan) }
        </div>;
      }

      if (subscription.status === "Canceled") {
        return <div className="alert alert-danger">
          { Text.SubscriptionExpired }{" "}{ Text.SelectToRenew }
        </div>;
      }

      return <div className="alert alert-warning">
        { Text.NoPlan }{" "}{ Text.SelectToRenew }
      </div>;
    }

    onBack() {
      this.mutateState((s) => s.showBillingEmail = false);
    }

    // Callback for selection, returns promise since we may need to wait on
    // Stripe
    onSelect(plan: Types.PlanDetails) {
      if (plan.enterprise) {
        this.mutateState((s) => s.showBillingEmail = true);
        return $.Deferred<void>().resolve().promise();
      }

      // Check if we need to ask for stripe CC
      let needStripe = this.props.details &&
        _.isEmpty(this.props.details.cards);
      if (needStripe) {
        let dfd = $.Deferred<void>();
        Esper.Stripe.getHandler().then((handler) => handler.open({
          label: "Submit",
          description: plan.name,
          token: (token) => Actions.Subscriptions.set({
            cusId: this.props.details.cusid,
            planId: plan.id,
            cardToken: token.id,
            redirectTarget: this.props.redirect
          }).then(() => dfd.resolve()),
          closed: () => { dfd.state() === "pending" ? dfd.reject() : null }
        }));
        return dfd.promise();
      }

      // Else, just change plan
      return Actions.Subscriptions.set({
        cusId: this.props.details.cusid,
        planId: plan.id,
        redirectTarget: this.props.redirect
      });
    }
  }
}
