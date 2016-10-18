/*
  Component implementing Stripe Checkout for credit cards
  https://stripe.com/docs/checkout
*/

module Esper.Components {
  interface Props {
    description: string;
    label: string;
    onToken: (token: StripeTokenResponse) => void;
  }

  export class Stripe extends ReactHelpers.Component<Props, {}> {
    _handler: StripeCheckoutHandler;

    constructor(props: Props) {
      super(props);
      this.initStripe();
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this._handler) {
        this._handler.close();
      }
    }

    initStripe() {
      // From https://stripe.com/docs/checkout#integration-custom
      this._handler = StripeCheckout.configure({
        key: Config.STRIPE_KEY,
        email: Login.myEmail(),

        // Esper logo
        image: 'https://s3.amazonaws.com/stripe-uploads/' +
               'acct_14skFFJUNehGQrIumerchant-icon-' +
               '1425935548640-Logo_symbol.png',

        locale: 'auto',
        token: this.props.onToken
      });
    }

    render() {
      return <button className="btn btn-primary"
                     onClick={() => this.onClick()}>
        Enter Payment Info
      </button>
    }

    onClick() {
      this._handler.open({
        name: 'Esper',
        description: this.props.description,
        billingAddress: true,
        zipCode: true,
        panelLabel: this.props.label
      });
    }
  }
}
