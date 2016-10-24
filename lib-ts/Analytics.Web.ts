/*
  Module for calling Segment's Analytics.JS when loaded on a website we
  control. Assumes there is an analytics object floating around in Esper
  or global scope.
*/

/// <reference path="./Analytics.ts" />
/// <reference path="./Login.Web.ts" />
/// <reference path="./ApiT.ts" />

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

  /*
    Identify if loginInfo is unavailable. Can use to identify someone's e-mail
    before they login.
  */
  export function preIdentify<T extends {}>(props: T, cb?: () => void) {
    if (Login.asAdmin) return;
    analytics.ready(function() {
      analytics.identify(props, cb);
    });
  }

  // Post-login identify
  export function identify(loginInfo?: ApiT.LoginResponse, cb?: () => void) {
    if (Login.asAdmin) return;
    analytics.ready(function() {
      if (loginInfo && Login.myUid()) {
        if (analytics.user().id() !== Login.myUid()) {
          if (loginInfo.is_sandbox_user) {
            analytics.identify({
              sandbox: true
            }, cb);

          } else {

            // Alias user if new account
            if (loginInfo.account_created &&
                moment().diff(moment(loginInfo.account_created)) < 300000)
            {
              analytics.alias(Login.myUid());
            }

            // Identify user regardless of previous login status
            analytics.identify(Login.myUid(), {
              email: loginInfo.email,
              platform: loginInfo.platform,
              sandbox: false
            }, cb);
          }
        }
      }

      // Don't reset if sandbox user -- persist until we can identify
      else if (!(Login.data && Login.data.is_sandbox_user)) {
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
  export function page(page: Page, properties?: any, cb?: () => void) {
    if (Login.asAdmin) return;
    properties = flatten(properties || {});
    properties['url'] = location.href; // So hash is included
    analytics.ready(function() {
      analytics.page(Page[page], properties, cb);
    });
  }

  export function track(event: Trackable, properties?: Object,
                        cb?: () => void) {
    if (Login.asAdmin) return;
    var eventName = Trackable[event];
    analytics.ready(function() {
      analytics.track(eventName, flatten(properties || {}), cb);
    });
  }
}
