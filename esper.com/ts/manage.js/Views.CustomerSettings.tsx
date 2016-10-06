/*
  Base class for a customer settings view

  Override renderMain function
*/

module Esper.Views {
  // CusID required
  interface Props extends Types.SettingsPageProps {
    cusId: string;
  }

  export abstract class CustomerSettings
         extends ReactHelpers.Component<Props, {}> {
    pathFn: (p: {cusId: string}) => Paths.Path;

    renderWithData() {
      let cust = Stores.Customers.require(this.props.cusId);
      if (! cust) return <span />;

      let subMenu = <Components.CustomerSettingsMenu
        cust={cust}
        pathFn={this.pathFn}
      />;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        { this.renderMain(cust) }
      </Views.Settings>
    }

    abstract renderMain(cust: ApiT.Customer): JSX.Element;
  }
}
