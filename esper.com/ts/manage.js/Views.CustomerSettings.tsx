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
      if (! ready) return <div className="esper-spinner" />;

      let cust = Stores.Customers.require(this.props.cusId);
      if (! cust) return <span />;

      return <Views.Settings {...this.props} subMenu={subMenu}>
        <AddCard cust={cust} />
        { this.renderMain(cust) }
      </Views.Settings>
    }

    abstract renderMain(cust: ApiT.Customer): JSX.Element;
  }


  interface AddCardProps {
    cust: ApiT.Customer;
  }

  class AddCard extends ReactHelpers.Component<AddCardProps, { busy: boolean }> {
    constructor(props: AddCardProps) {
      super(props);
      this.state = { busy: false };
    }

    render() {
      let expired = this.props.cust.subscription.status === "Past_due";
      return <div className={classNames("alert msg action-block", {
        "alert-warning": !expired,
        "alert-danger": expired
      })}>
        { this.state.busy ?
          <span><span className="esper-spinner" /></span>:
          <Components.Stripe
            description={Text.getPlanName(Config.DEFAULT_ENTERPRISE_PLAN)}
            label="Submit" stripeKey={Config.STRIPE_KEY}
            onToken={(token) => this.onToken(token)}
          >
            { expired ? `${Text.SubscriptionExpired} ${Text.EnsureCreditCard}`
                      : `${Text.NoPlan} ${Text.UpdateCreditCard}` }
          </Components.Stripe> }
      </div>
    }

    onToken(token: StripeTokenResponse) {
      this.setState({ busy: true });
      let cusId = this.props.cust.id;
      let planId = Config.DEFAULT_ENTERPRISE_PLAN;

      // Run in parallel with actual actions
      Actions.Subscriptions.set({cusId, planId, cardToken: token.id})
        .always(() => this.setState({ busy: false }));
    }
  }
}
