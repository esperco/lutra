/*
  Refactored login code between Otter, Stoat, etc. The purpose of this module
  isn't necessarily to facilitate login but to provide standardized access
  to things like UID and API secret.

  See Login.Oauth for actual API calls.
*/

/// <reference path="./ApiT.ts" />
/// <reference path="./JsonHttp.ts" />

module Esper.Login {

  export interface Credentials {
    uid: string;
    apiSecret: string;
  }

  // Actual variable storing everything
  export var credentials: Credentials;

  export function loggedIn(): boolean {
    return !!(credentials && credentials.uid);
  }

  export function myUid(): string {
    return credentials && credentials.uid;
  }

  // Alias to myUid used in Otter
  export var me = myUid;

  export function getApiSecret(): string {
    return credentials && credentials.apiSecret;
  }

  export function setCredentials(uid: string, secret: string) {
    credentials = {
      uid: uid,
      apiSecret: secret
    };
  }

  export function unsetCredentials() {
    credentials = null;
  }

  /*
    When logging in, remember to fix offset before calling anything that
    needs to be signed with the accurate time
  */
  export function fixOffset() {
    return Api.clock().then((v) =>
      (moment(v.timestamp).valueOf() / 1000) -
      (Date.now() / 1000)
    ).then((o) => JsonHttp.offset = o);
  }
}
