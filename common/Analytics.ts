/*
  Shared code between extension and injected script analytics
*/

/// <reference path="../marten/ts/Analytics.ts" />

module Esper.Analytics {
  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}
