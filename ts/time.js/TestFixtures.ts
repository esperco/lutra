/*
  time.js-specific test fixtures
*/

/// <reference path="../lib/TestFixtures.ts" />

module Esper.TestFixtures {

  export function mockTimeLogin() {
    mockLogin();
    Main.initAll();
  }
}
