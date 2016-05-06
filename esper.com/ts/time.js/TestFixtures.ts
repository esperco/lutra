/*
  time.js-specific test fixtures
*/

/// <reference path="../lib/TestFixtures.ts" />

module Esper.TestFixtures {

  export function mockTimeLogin() {
    resetTime();
    mockLogin();
    Main.initAll();
  }

  export function resetTime() {
    reset();
    Events2.EventsForDateStore.reset();
    Events2.EventsForDateStore.removeAllChangeListeners();
    Events2.EventStore.reset();
    Events2.EventStore.removeAllChangeListeners();
  }
}
