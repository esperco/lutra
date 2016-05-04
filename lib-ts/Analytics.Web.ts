/*
  Module for calling Segment's Analytics.JS when loaded on a website we
  control. Assumes there is an analytics object floating around in Esper
  or global scope.
*/

/// <reference path="../lib/Analytics.ts" />
/// <reference path="../lib/Login.ts" />
/// <reference path="../lib/ApiT.ts" />

module Esper.Analytics {
  // Stub in case Segment doesn't load (e.g. ad-blocker)
  if (! (<any> window).analytics) {
    (<any> window).analytics = {
      ready: function() {},
      user: function() {},
      track: function() {},
      page: function() {}
    }
  }

  export function identify(loginInfo?: ApiT.LoginResponse) {
    analytics.ready(function() {
      if (loginInfo && Login.myUid()) {
        if (analytics.user().id() !== Login.myUid() && loginInfo) {

          // Alias user if new account
          if (loginInfo.account_created &&
              moment().diff(moment(loginInfo.account_created)) < 300000)
          {
            analytics.alias(Login.myUid());
          }

          // Identify user regardless of previous login status
          analytics.identify(Login.myUid(), {
            email: loginInfo.email,
            platform: loginInfo.platform
          });
        }
      } else {
        reset();
      }
    });
  }

  // Clear tracking IDs
  export function reset() {
    var user = analytics.user();
    user.logout();
    user.reset();
  }

  // Track which page you're on
  export function page(page: Page, properties?: any) {
    properties = flatten(properties || {});
    properties['url'] = location.href; // So hash is included
    analytics.ready(function() {
      analytics.page(Page[page], properties);
    });
  }

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.ready(function() {
      analytics.track(eventName, flatten(properties || {}));
    });
  }
}
