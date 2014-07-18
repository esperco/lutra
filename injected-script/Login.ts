module Login {
  /* Cached UID and API secret and user ID.
     They should be used as long as the API doesn't reject it. */
  export var credentials : EsperStorage.Credentials;

  export var info : ApiT.LoginResponse;

  export function myUid() {
    if (credentials !== undefined)
      return credentials.uid;
    else
      return;
  }

  export function myGoogleAccountId() {
    if (credentials !== undefined)
      return credentials.googleAccountId;
    else
      return;
  }

  export function myEmail() {
    if (info !== undefined)
      return info.email;
    else
      return;
  }

  export function myTeams() {
    if (info !== undefined)
      return info.teams;
    else
      return;
  }
}
