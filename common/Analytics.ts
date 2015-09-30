/*
  Shared code between extension and injected script analytics
*/
module Esper.Analytics {
  // Events to track
  export enum Trackable {
    ClickEsperLogo = 1,
    ClickSendAgenda,
    ClickSendTaskList
  };

  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}