/*
  General settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerAccountsSettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.accounts;

    // TODO
    renderMain(cust: ApiT.Customer) {
      return <div>
        Accounts
      </div>;
    }
  }
}
