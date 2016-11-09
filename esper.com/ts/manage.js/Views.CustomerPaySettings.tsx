/*
  Payments settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerPaySettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.pay;

    renderMain(cust: ApiT.Customer) {
      var busy = Stores.Subscriptions.status(cust.id)
        .mapOr(false, (d) => d === Model2.DataStatus.FETCHING);
      if (busy) {
        return <div className="esper-spinner" />;
      }

      let details = Stores.Subscriptions.require(cust.id);
      return <div className="panel panel-default"><div className="panel-body">
        {
          details.active ?
          <div className="alert alert-info">
            { Text.SubscribedToPlan(Text.ThisCustomer, cust.subscription.plan) }
          </div> : null
        }
        <Components.CreditCardList subscription={details} />
      </div></div>;
    }
  }
}
