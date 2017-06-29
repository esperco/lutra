/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamPaySettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.pay;

    renderMain(team: ApiT.Team) {
      let subscription = team.team_api.team_subscription;
      let subBusy = Stores.Subscriptions.status(subscription.cusid)
        .mapOr(false, (d) => d === Model2.DataStatus.FETCHING);
      let custBusy = !Stores.Customers.ready();
      if (subBusy || custBusy) {
        return <div className="esper-spinner" />;
      }

      let details = Stores.Subscriptions.get(subscription.cusid)
        .unwrapOr(null);
      let customer = Stores.Customers.get(subscription.cusid).unwrapOr(null);

      return <div>
        <Components.PaymentInfo
          stripeKey={Config.STRIPE_KEY}
          team={team}
          customers={Stores.Customers.all()}
          details={details}
        />
        { details && customer && !!customer.teamid ?
          <div className="panel panel-default">
            <div className="panel-body">
              <Components.CreditCardList subscription={details} />
            </div>
         </div> : null }
      </div>;
    }

    componentDidMount() {
      this.maybeRedirect();
    }

    componentDidUpdate() {
      super.componentDidUpdate();
      this.maybeRedirect();
    }

    maybeRedirect() {
      let team = Stores.Teams.get(this.props.teamId).unwrapOr(null);
      if (! team) return;

      let subscription = team.team_api.team_subscription;
      let customer = Stores.Customers.get(subscription.cusid).unwrapOr(null);
      if (customer && !customer.teamid) {
        Route.nav.go(Paths.Manage.Customer.pay({ cusId: customer.id }));
      }
    }
  }
}
