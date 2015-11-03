/// <reference path="./Esper.ts" />

module Esper.Conf {
  export var prod = true;
  export var publicStripeKey = "pk_live_ntMF09YuECJYPD6A9c4sfdHG";
  export var segmentKey = "ZxAl2zWkKLGVJesGQiIxEU1JKm0dPNd8";

  // Authorized domains and protocols for logging in
  export var authorizedDomains = [
    "http://esper.com",
    "https://app.esper.com",
    "https://time.esper.com",
    "https://directory.esper.com",
    "https://dir.esper.com"
  ];
}

Esper.PRODUCTION = true;
