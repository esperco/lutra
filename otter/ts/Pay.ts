module Esper.Pay {
  export function init() {
    if (window["Stripe"]) {
      window["Stripe"].setPublishableKey(Conf.publicStripeKey);
    }
  }
}
