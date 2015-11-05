/*
  Segment client
*/

/// <reference path="../marten/typings/segment-analytics/segment-analytics.d.ts" />
/// <reference path="../marten/typings/moment/moment.d.ts" />
/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Store.ts" />

module Esper.Analytics {

  // Helper to flatten objects into a single level, which works better with
  // Mixpanel than nested objects
  interface IFlatProps {
    [index: string]: number|string|boolean|Date;
  };
  function flatten(obj: Object, prefix?: string, ret?: IFlatProps): IFlatProps {
    ret = ret || {};
    prefix = prefix ? prefix + "." : "";
    for (let name in obj) {
      if (obj.hasOwnProperty(name)) {
        if (typeof obj[name] === "object") {
          ret = flatten(obj[name], prefix + name, ret);
        } else {
          ret[prefix + name] = obj[name];
        }
      }
    }
    return ret;
  }

  // Our actual analytics code /////////////

  export function init() {
    // Init with write key
    analytics.load(Conf.segmentKey);
  };

  // Store key for tracking the last user to alias
  var lastAliasKey = "lastAlias";

  // If we have a UID, identify ourselves. Otherwise dis-associate.
  // Takes an optional callback that resolves only after alias is complete,
  // or if no alias is required.
  export function identify(cb?: () => void) {
    cb = cb || function() { /* noop */ };
    analytics.ready(function() {
      var me = Login.me();
      if (me) {
        if (analytics.user().id() !== me && Login.data) {
          var aliasRequired = false;

          // Alias user if new account
          if (Login.data.account_created &&
              moment().diff(moment(Login.data.account_created)) < 300000 &&
              Store.get(lastAliasKey) !== me)
          {
            aliasRequired = true;
            analytics.alias(me, function() {
              Store.set(lastAliasKey, me);
              cb();
            });
          }

          // Identify user regardless of previous login status
          analytics.identify(me, {
            email: Login.data.email
          }, function() {
            if (!aliasRequired) { cb(); }
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
  export function page(page: string, properties?: Object) {
    properties = flatten(properties || {});
    properties['url'] = location.href; // So hash is included

    // For now, only track onboarding
    if (page === "onboarding") {
      var step = properties['step'] || 0;
      var pageNames;
      if (properties && properties["opts.exchange"]) {
        pageNames = [
          "Signin",
          "Name & Number",
          "Credit Card",
          "Send Email"
        ];
      } else {
        pageNames = [
          "Signin",
          "Name & Number",
          "Calendar",
          "Credit Card",
          "Send Email"
        ];
      }
      var pageName = pageNames[step] || "Step " + step;
      analytics.ready(function() {
        analytics.page("onboarding " + pageName, properties);
      });
    }
  }

  // Events to track
  export enum Trackable {
    ClickSignIn,

    /* Trackables are deprecated with removal of exec onboarding */
    ClickShareCalendar,
    ClickCreditCard,
    ClickCongratsEmail,
    ClickLearnMoreAboutEsper,
    ClickPostOnboardingPreferencesButton
  };

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.ready(function() {
      analytics.track(eventName, flatten(properties || {}));
    });
  }
}
