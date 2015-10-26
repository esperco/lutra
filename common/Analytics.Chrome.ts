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
/// <reference path="./ExtensionOptions.Storage.ts" />
/// <reference path="./Util.ts" />

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

    // Alias uid with anonymous id and then delete it
    if (hasAnonId()) {
      analytics.alias({
        previousId: getAnonId(),
        userId: uid
      });
    }

    // Identify with some traits -- but only after flushing any anon calls
    // so we can mitigate chance of MixPanel race conditions
    analytics.flush(function() {
      ExtensionOptions.load(function(opts) {
        var optsFlattened: { [index: string]: string } = {};
        _.each(ExtensionOptions.enumToString(opts), function(v,k) {
          optsFlattened["opts." + k] = v;
        });

        analytics.identify({
          userId: uid,
          traits: _.extend({
            email: Login.myEmail() || Login.myGoogleAccountId(),
            teams: _.pluck(Login.myTeams(), 'teamid'),
          }, optsFlattened)
        });
      });

      // Associate users with team groups
      var teams = Login.myTeams();
      _.each(teams, function(team) {
        analytics.group({
          userId: uid,
          groupId: team.teamid,
          traits: {
            name: team.team_name,
            execId: team.team_executive,
            anonymous: false
          }
        });
      });

      deleteAnonId();
    });
  }

  /*
    Create a temporary anonymousId we can use analytics purposes if user is
    not logged in yet
  */
  var _anonId: string;

  function getAnonId(): string {
    if (! _anonId) {
      /*
        Use googleAccountId in lieu of anon ID if possible because Mixpanel
        only lets us associate one anonymous ID with a user for aliasing later
      */
      var account = Login.getAccount();
      _anonId = ((account && account.googleAccountId) ||
                 ("anon_" + Util.randomString()));
      analytics.identify({
        userId: _anonId,
        traits: {
          anonymous: true
        }
      });
      analytics.flush();
    }
    return _anonId;
  }

  function deleteAnonId(): void {
    _anonId = null;
  }

  function hasAnonId(): boolean {
    return !!_anonId;
  }

  export function track(event: Trackable, properties?: Object) {
    var eventName = Trackable[event];
    analytics.track({
      // Use anonId if we have one (it'll be cleared after alias is complete)
      userId: hasAnonId() ? getAnonId() : Login.myUid() || getAnonId(),

      event: eventName,
      properties: properties || {}
    });
  }

  // Call before doing something that might cause analytics to not get sent
  export function flush(cb: (err: Error) => void): void {
    analytics.flush(cb);
  }
}