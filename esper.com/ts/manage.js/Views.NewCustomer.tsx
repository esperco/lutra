/*
  New Group page
*/

module Esper.Views {
  interface Props {
  }

  export class NewCustomer extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      return <div className="team-settings-page esper-expanded">
        <Components.ManageSidebar
          teams={Stores.Teams.all()}
          customers={Stores.Customers.all()}
          groups={Stores.Groups.all()}
          newCustomer={true}
        />

        <div className="esper-content padded">
          <div id="new-customer-page" className="esper-expanded">
            Hello world
          </div>
        </div>
      </div>;
    }
  }
}
