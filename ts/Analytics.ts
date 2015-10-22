/*
  Segment client
*/

/// <reference path="../marten/typings/segment-analytics/segment-analytics.d.ts" />

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

  // If we have a UID, identify ourselves. Otherwise dis-associate
  export function identify() {
    (<any>console).trace("Identify!");

    analytics.ready(function() {
      var me = Login.me();
      if (me) {
        /*
          Only identify if we don't have a previous identity AND  we have
          existing teams. If no teams, that means we're in the middle of
          onboarding. Onboarding analytics is handled by extension. Don't
          identify because this will interfere with analytics there (expecially
          when using Mixpanel).
        */
        if (analytics.user().id() !== me && Login.data &&
            Login.data.teams && Login.data.teams.length > 0) {
          analytics.alias(me);
          analytics.identify(me, {
            email: Login.data.email
          });
        }
      } else {
        reset();
      }
    });
  }

  // Clear tracking IDs
  export function reset() {
    (<any>console).trace("reset!");
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
