/// <reference path="./Esper.ts" />

module Esper.Conf {
  export var prod = false;
  export var publicStripeKey = "pk_test_tDzGbpaybyFQ3A7XGF6ctE3f";
  export var segmentKey = "QwsMs5clHuU0IhYhq664x8VyV32HFph6";

  // Authorized domains and protocols for logging in
  export var authorizedDomains = [
    "http://esper.com",
    "https://app.esper.com",
    "http://localhost",
    "http://localhost:5000"
  ];
}

Esper.PRODUCTION = false;
