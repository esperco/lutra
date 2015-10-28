/*
  Refactored login code between Otter, Stoat, etc. The purpose of this module
  isn't necessarily to facilitate login but to provide standardized access
  to things like UID and API secret.

  We should refactor more of the login code between everything, but that's
  a more involved project than necessary at the moment.
*/
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
}