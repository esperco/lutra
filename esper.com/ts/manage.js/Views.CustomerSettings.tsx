/*
  Base class for a customer settings view

  Override renderMain funciton
*/

module Esper.Views {
  interface Props {
    custId: string;
    msg?: string;
    err?: string;
  }

  export abstract class CustomerSettings
         extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {custId: string}) => Paths.Path;

    renderWithData() {
      var cust = Stores.Customers.require(this.props.custId);
      if (! cust) return <span />;

      return <div className="customer-settings-page esper-expanded">
        <Components.ManageSidebar
          activeCustId={this.props.custId}
          teams={Stores.Teams.all()}
          groups={Stores.Groups.all()}
          customers={Stores.Customers.all()}
          pathFn={this.pathFn}
        />

        <div className="esper-content padded">
          <Components.CustomerSettingsMenu
            cust={cust}
            pathFn={this.pathFn}
          />

          <div className="esper-expanded">
            {
              this.props.msg ?
              <div className="alert msg alert-info">{ this.props.msg }</div> :
              null
            }
            {
              this.props.err ?
              <div className="alert msg alert-danger">{ this.props.err }</div> :
              null
            }
            { this.renderMain(cust) }
          </div>
        </div>
      </div>;
    }

    abstract renderMain(cust: ApiT.Customer): JSX.Element;
  }
}
