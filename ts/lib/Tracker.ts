/*
  Tracking code is loosely inspired by Meteor's tracker
  (https://www.meteor.com/tracker).

  It is intended for use with our React classes. Basic idea is to track
  calls to our stores to make it easy to set up auto-updating React
  components.

  Track takes two functions. It calls the first function and returns its
  return value. It also calls the post function with a list of variables
  that have been tracked.
*/

/// <reference path="./Emit.ts" />

module Esper.Tracker {
  export interface TrackingKey {
    store: Emit.EmitBase;
    key?: any;
  }

  export function track<T>(main: () => T,
    post: (args: TrackingKey[]) => void): T
  {
    trackingKeys = [];
    trackingMap = {};
    isTrackingActive = true;
    var ret = main();
    post(trackingKeys);
    isTrackingActive = false;
    return ret;
  }

  export function register(store: Emit.EmitBase, key?: any) {
    var mapId = store.id + (key ? Util.cmpStringify(key) : "");

    // Avoid duplicate registries
    if (isTrackingActive && !trackingMap[mapId]) {
      trackingMap[mapId] = true;
      if (key) {
        trackingKeys.push({
          store: store,
          key: key
        });
      } else {
        trackingKeys.push({
          store: store,
        });
      }
    }
  }

  // Boolean to test if tracking is active
  var isTrackingActive = false;

  // A list of registered trackingKeys we're tracking
  var trackingKeys: TrackingKey[];

  // A hash map of tracking keys for faster lookup
  var trackingMap: { [index: string]: boolean; }
}
