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

      let subMenu = <Components.SettingsMenu>
        { /* Nothing on general page yet -- so remove link */
          /* <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Customer.general}>
          { Text.CustomerGeneral }
        </Components.SettingsMenuLink> */ }
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Customer.accounts}>
          { Text.CustomerAccounts }
        </Components.SettingsMenuLink>
        <Components.SettingsMenuLink {...this.props}
            href={Paths.Manage.Customer.pay}>
          { Text.CustomerPay }
        </Components.SettingsMenuLink>
      </Components.SettingsMenu>;

      let ready = Stores.Customers.ready();
      return <Views.Settings {...this.props} subMenu={subMenu}>
        { ready ? this.renderMain(cust) : <div className="esper-spinner" /> }
      </Views.Settings>
    }

    abstract renderMain(cust: ApiT.Customer): JSX.Element;
  }
}
