module Esper.Pay {
  export function init() {
    window["Stripe"].setPublishableKey(Conf.publicStripeKey);
  }
}
