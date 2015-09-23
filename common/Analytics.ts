module Analytics {
  export function init() {
    analytics.load(Conf.segmentKey);
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

  // Events to track
  export enum Trackable {
    ClickSendAgenda,
    ClickSendTaskList
  };

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.ready(function() {
      analytics.track(eventName, flatten(properties || {}));
    });
  }
}