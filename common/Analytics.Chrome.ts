/*
  This contains Analytics code specific to the content-script side of things,
  or to pages where we're not worried about an analytics object in the global
  namespace.
*/

/// <reference path="../marten/typings/segment-analytics/segment-analytics.d.ts" />
/// <reference path="./Analytics.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Message.ts" />

module Esper.Analytics {
  export function init() {
    analytics.load(Conf.segmentKey);

    // Listen for posted messages to track
    Message.listen(Message.Type.Track, function(data: TrackMessage) {
      console.error(data);
      track(data.event, data.properties);
    });
  }

  // If we have a UID, identify ourselves. Otherwise dis-associate
  export function identify() {
    analytics.ready(function() {
      var me = Login.myUid();
      if (me) {
        // Only identify if we don't have a previous identity
        if (analytics.user().id() !== me) {
          analytics.alias(me);
          analytics.identify(me, {
            email: Login.myEmail()
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

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.ready(function() {
      analytics.track(eventName, properties || {});
    });
  }
}