/*
  Convenience functions for logging in as certain users in dev mode
*/

/// <reference path="./Login.ts" />

module Esper.Login {
  // Stubs credentials for our "Lois" user
  export function stubLois() {
    Login.storeCredentials({
      uid: "O-w_lois_____________w",
      api_secret: "lois_secret",
      email: "lois@esper.com"
    });
  }
}
