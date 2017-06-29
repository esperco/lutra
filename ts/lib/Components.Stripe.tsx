/*
  Component implementing Stripe Checkout for credit cards
  https://stripe.com/docs/checkout
*/

/// <reference path="./Stripe.ts" />

module Esper.Components {
  interface Props {
    stripeKey: string;
    description: string;
    label: string;
    onToken: (token: StripeTokenResponse) => void;
    children?: JSX.Element|JSX.Element[];
  }

  export class Stripe extends ReactHelpers.Component<Props, {}> {
    componentWillUnmount() {
      super.componentWillUnmount();
      if (Esper.Stripe.handler) {
        Esper.Stripe.handler.close();
      }
    }

    render() {
      return <span onClick={this.onClick.bind(this)}>
        { this.props.children }
      </span>;
    }

    onClick() {
      Esper.Stripe.getHandler().then((handler) => handler.open({
        name: 'Esper',
        description: this.props.description,
        panelLabel: this.props.label,
        token: this.props.onToken
      }));
    }
  }
}
