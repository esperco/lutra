/*
  This contains Analytics code actually responsible for making calls to the
  server. We use the Segment Node.js library rather than the client-side
  Analytics.js library because it works better with Chrome extensions.
*/

/// <reference path="../lib/Analytics.Iframe.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/Analytics.ts" />
/// <reference path="../common/Message.Chrome.ts" />
/// <reference path="../common/ExtensionOptions.Storage.ts" />
/// <reference path="../common/Util.ts" />

declare module Esper.Conf {
  export var version: string;
  export var segmentKey: string;
}

module Esper.Analytics {
  export function init() {
    // Listen for posted messages to track
    Message.listenToExtension(Message.Type.Track, trackChrome);

    // Listen for posted messages to identify
    Message.listenToExtension(Message.Type.Identify, identifyChrome);

    writeKey = Esper.Conf.segmentKey;
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

      identifyViaIframe(uid, _.extend({
        extensionVersion: Conf.version,
        email: data.info && data.info.email,
        teams: _.pluck(teams, 'teamid'),
      }, optsFlattened));
    });
  }

  export function trackChrome(data: TrackMessage) {
    trackViaIframe(data.event, data.properties);
  }
}
