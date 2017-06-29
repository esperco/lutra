/*
  General settings page
*/

/// <reference path="./Views.CustomerSettings.tsx" />

module Esper.Views {
  export class CustomerGeneralSettings extends CustomerSettings {
    pathFn = Paths.Manage.Customer.general;

    // TODO
    renderMain(cust: ApiT.Customer) {
      return <div>
        General
      </div>;
    }
  }
}
