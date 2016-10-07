/*
  Payments settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerPaySettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.pay;

    // TODO
    renderMain(cust: ApiT.Customer) {
      return <div>
        Pay
      </div>;
    }
  }
}
