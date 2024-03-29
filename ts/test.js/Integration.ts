// Integration test helpers

/// <reference path="../lib/Util.ts" />
/// <reference path="../lib/Login.Web.ts" />

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

  // Use to clear login credentials
  export function clearLogin() {
    Login.clearCredentials();
  }
}
