/*
  This contains Analytics code actually responsible for making calls to the
  server. We use the Segment Node.js library rather than the client-side
  Analytics.js library because it works better with Chrome extensions.
*/

/// <reference path="../marten/typings/analytics-node/analytics-node.d.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Conf.ts" />
/// <reference path="./Analytics.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Message.ts" />

module Esper.Analytics {
  // Reference to Analytics NodeJS library
  var analytics: AnalyticsNode.Analytics;

  export function init() {
    // Initialize Analytics instance
    var opts: Object = {};
    if (! Conf.prod) {
      opts = { flushAt: 1 };
    }
    analytics = new AnalyticsJs(Conf.segmentKey, opts);

    // Listen for posted messages to track
    Message.listen(Message.Type.Track, function(data: TrackMessage) {
      track(data.event, data.properties);
    });
  }

  // If we have a UID, identify ourselves -- should be called after login
  // info set to get the most info available
  export function identify() {
    var uid = Login.myUid();
    if (!uid) {
      Log.e("Unable to identify -- not logged in.");
      return;
    }

    if (!Login.watchableInfo.isValid()) {
      Log.w("Login info unavailable for identification. UID only.");
    }

    analytics.identify({
      userId: Login.myUid(),
      traits: {
        email: Login.myEmail() || Login.myGoogleAccountId(),
        teams: _.pluck(Login.myTeams(), 'teamid')
      }
    });

    // Associate users with team groups
    var teams = Login.myTeams();
    _.each(teams, function(team) {
      analytics.group({
        userId: uid,
        groupId: team.teamid,
        traits: {
          name: team.team_name,
          execId: team.team_executive
        }
      });
    });
  }

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.track({
      userId: Login.myUid(),
      event: eventName,
      properties: properties || {}
    });
  }
}