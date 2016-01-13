/*
  Module for calling Segment's Analytics.JS when loaded on a website we
  control. Assumes there is an analytics object floating around in Esper
  or global scope.
*/

/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/segment-analytics/segment-analytics.d.ts" />
/// <reference path="../lib/Analytics.ts" />
/// <reference path="../lib/Login.ts" />
/// <reference path="../lib/ApiT.ts" />

module Esper.Analytics {
  export function init(key: string) {
    writeKey = key; // Sets module-level variable used elsewhere

    // Init with write key
    analytics.load(writeKey);
  };

  export function identify(loginInfo?: ApiT.LoginResponse,
                           alias=false, cb=function() {}) {
    var cbCalled = false;
    var cbWrap = () => {
      if (! cbCalled) {
        cbCalled = true;
        cb();
      }
    };

    analytics.ready(function() {
      if (loginInfo && Login.myUid()) {
        if (analytics.user().id() !== Login.myUid() && loginInfo) {

          // Alias user if new account
          if (alias && loginInfo.account_created &&
              moment().diff(moment(loginInfo.account_created)) < 300000)
          {
            analytics.alias(Login.myUid(), cbWrap);
          }

          // Identify user regardless of previous login status
          analytics.identify(Login.myUid(), {
            email: loginInfo.email
          }, cbWrap);
        }
      } else {
        reset();
      }
    });

    // Schedule timeout to auto-call cb in case Analytics.js fails
    setTimeout(cbWrap, 2000);
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
