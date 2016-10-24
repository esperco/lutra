/*
  Component implementing Stripe Checkout for credit cards
  https://stripe.com/docs/checkout
*/

module Esper.Components {
  interface Props {
    stripeKey: string;
    description: string;
    label: string;
    onToken: (token: StripeTokenResponse) => void;
    children?: JSX.Element|JSX.Element[];
  }

  export class Stripe extends ReactHelpers.Component<Props, {}> {
    _handler: StripeCheckoutHandler;
    _handlerDfd: JQueryDeferred<StripeCheckoutHandler>;
    _timeout: number;

    constructor(props: Props) {
      super(props);
      this._handlerDfd = $.Deferred();
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this._handler) {
        this._handler.close();
      }
    }

    initStripe() {
      // Make sure Stripe is loaded first -- if not, try again in 2 seconds
      if (! (window as any)["StripeCheckout"]) {
        clearTimeout(this._timeout);
        this._timeout = setTimeout(() => this.initStripe(), 2000);
        return;
      }

      // From https://stripe.com/docs/checkout#integration-custom
      this._handler = this._handler || StripeCheckout.configure({
        key: this.props.stripeKey,
        email: Login.myEmail(),

        // Esper logo
        image: 'https://s3.amazonaws.com/stripe-uploads/' +
               'acct_14skFFJUNehGQrIumerchant-icon-' +
               '1425935548640-Logo_symbol.png',

        locale: 'auto',
        token: this.props.onToken
      });

      if (this._handlerDfd.state() !== "resolved") {
        this._handlerDfd.resolve(this._handler);
      }
    }

    getStripe() {
      if (! this._handler) { this.initStripe(); }
      return this._handlerDfd.promise();
    }

    render() {
      return <span onClick={this.onClick.bind(this)}>
        { this.props.children }
      </span>;
    }

    onClick() {
      this.getStripe().then((handler) => handler.open({
        name: 'Esper',
        description: this.props.description,
        billingAddress: true,
        zipCode: true,
        panelLabel: this.props.label
      }));
    }
  }
}
