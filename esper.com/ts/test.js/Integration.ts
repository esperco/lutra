// Integration test helpers

/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Integration {
  // Should we run integration tests?
  export function runIntegrationTests() {
    return Util.getParamByName('integration') !== "no";
  }

  // If not running integration tests, skip
  export var describe = function(...args: any[]) {
    if (runIntegrationTests()) {
      (<any> window).describe(...args);
    }
  }

  // Stubs credentials for our "Lois" user
  export function stubLois() {
    Login.storeCredentials({
      uid: "O-w_lois_____________w",
      api_secret: "lois_secret",
      email: "lois@esper.com"
    });
  }

  // Use to clear login credentials
  export function clearLogin() {
    Login.clearCredentials();
  }
}
