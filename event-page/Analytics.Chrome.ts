/*
  This contains Analytics code actually responsible for making calls to the
  server. We use the Segment Node.js library rather than the client-side
  Analytics.js library because it works better with Chrome extensions.
*/

/// <reference path="../marten/typings/analytics-node/analytics-node.d.ts" />
/// <reference path="../marten/ts/Analytics.Iframe.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/Conf.ts" />
/// <reference path="../common/Analytics.ts" />
/// <reference path="../common/Message.Chrome.ts" />
/// <reference path="../common/ExtensionOptions.Storage.ts" />
/// <reference path="../common/Util.ts" />

declare module Esper.Conf {
  export var version: string;
}

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

    // Set for iFrame too
    writeKey = Conf.segmentKey;

    // Listen for posted messages to track
    Message.listenToExtension(Message.Type.Track, trackChrome);

    // Listen for posted messages to identify
    Message.listenToExtension(Message.Type.Identify, identifyChrome);
  }

  // If we have a UID, identify ourselves -- should be called after login
  // info set to get the most info available
  export function identifyChrome(data: IdentifyMessage) {
    var uid = data.uid;
    var teams = (data.info && data.info.teams) || [];

    // Identify with some traits
    ExtensionOptions.load(function(opts) {
      var optsFlattened: { [index: string]: string } = {};
      _.each(ExtensionOptions.enumToString(opts), function(v,k) {
        optsFlattened["opts." + k] = v;
      });

      analytics.identify({
        userId: uid,
        traits: _.extend({
          extensionVersion: Conf.version,
          email: data.info && data.info.email,
          teams: _.pluck(teams, 'teamid'),
        }, optsFlattened)
      });

      // Associate users with team groups
      _.each(teams, function(team) {
        analytics.group({
          userId: uid,
          groupId: team.teamid,
          traits: {
            name: team.team_name,
            execId: team.team_executive,
          }
        });
      });
    });
  }

  export function trackChrome(data: TrackMessage) {
    if (data.uid) {
      analytics.track({
        userId: data.uid,
        event: Trackable[data.event],
        properties: data.properties || {}
      });
    }

    else {
      // Anonymous user => use esper.com's tracking ID
      trackViaIframe(data.event, data.properties);
    }
  }
}