/*
  Shared code between extension and injected script analytics
*/

/// <reference path="../lib/Analytics.ts" />
/// <reference path="../lib/ApiT.ts" />
/// <reference path="../common/Message.Chrome.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Analytics {
  export interface TrackMessage {
    uid: string,
    event: Trackable,
    properties: any
  };

  export interface IdentifyMessage {
    uid: string,
    info: ApiT.LoginResponse
  };

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

    Message.post(Message.Type.Identify, (<IdentifyMessage> {
      uid: uid,
      info: Login.watchableInfo.get()
    }));
  }

  export function track(event: Trackable, properties?: Object) {
    Message.post(Message.Type.Track, (<TrackMessage> {
      uid: Login.myUid(),
      event: event,
      properties: properties
    }));
  }

  export function trackCreateTask(team: ApiT.Team, threadId: string) {
    track(Trackable.CreateTask, {
      teamId: team.teamid,
      teamName: team.team_name,
      threadId: threadId
    });
  }
}
