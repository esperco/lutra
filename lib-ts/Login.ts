/*
  Refactored login code between Otter, Stoat, etc. The purpose of this module
  isn't necessarily to facilitate login but to provide standardized access
  to things like UID and API secret.

  See Login.Oauth for actual API calls.
*/
/// <reference path="./ApiT.ts" />

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


  /* Utilities mostly used by Otter */

  // Set to provide default for utils
  export var data: ApiT.LoginResponse;

  export function isAdmin(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.is_admin === true;
    else
      return false;
  };

  export function isAlias(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.is_alias === true;
    else
      return false;
  };

  export function usesGoogle(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.platform === "Google";
    else
      return false;
  };

  export function usesNylas(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.platform === "Nylas";
    else
      return false;
  };

  export function isExecCustomer(team: ApiT.Team, x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.uid === team.team_executive
        && !isAdmin()
        && !isAlias();
    else
      return false;
  };

  export function myEmail(x?: ApiT.LoginResponse) {
    x = x || data;
    if (! _.isUndefined(x))
      return x.email;
    else
      return;
  };

  export function getTeams(x?: ApiT.LoginResponse): ApiT.Team[] {
    x = x || data;
    if (! _.isUndefined(x))
      return x.teams;
    else
      return [];
  };
}
