module Login {
  export var info : ApiT.LoginResponse;

  export function myUid() {
    if (info !== undefined)
      return info.uid;
    else
      return undefined;
  }

  export function myEmail() {
    if (info !== undefined)
      return info.email;
    else
      return undefined;
  }

  export function myTeams() {
    if (info !== undefined)
      return info.teams;
    else
      return undefined;
  }
}
