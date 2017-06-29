/*
  Standalone Stripe Checkout code
*/

/// <reference path="./Login.Web.ts" />

module Esper.Stripe {
  var _timeout: number;
  var _handlerDfd: JQueryDeferred<StripeCheckoutHandler> = $.Deferred();
  export var handler: StripeCheckoutHandler;

  export function init(stripeKey: string) {
    // Make sure Stripe is loaded first -- if not, try again in 2 seconds
    if (! (window as any)["StripeCheckout"]) {
      clearTimeout(this._timeout);
      _timeout = setTimeout(init, 2000);
      return;
    }

    handler = handler || StripeCheckout.configure({
      key: stripeKey,
      email: Login.myEmail(),

      // Esper logo
      image: 'https://s3.amazonaws.com/stripe-uploads/' +
             'acct_14skFFJUNehGQrIumerchant-icon-' +
             '1425935548640-Logo_symbol.png',

      locale: 'auto'
    });

    if (_handlerDfd.state() !== "resolved") {
      _handlerDfd.resolve(handler);
    }
  }

  export function getHandler() {
    return _handlerDfd.promise();
  }
}
