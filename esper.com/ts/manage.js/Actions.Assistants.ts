module Esper.Actions.Assistants {
  // Adding a user currently doesn't affect team structure, so just return
  // API promise
  export function add(teamId: string, email: string) {
    return Api.inviteJoinTeam({
      from_uid: Login.myUid(),
      teamid: teamId,
      role: "Assistant",
      force_email: email
    });
  }

  // Removes an assistant from team
  export function remove(teamId: string, uid: string) {
    var team = Stores.Teams.require(teamId);
    if (! team) return;

    team = _.cloneDeep(team)
    _.pull(team.team_assistants, uid);

    var p = Api.removeAssistant(teamId, uid);
    Stores.Teams.TeamStore.push(teamId, p, Option.some(team));
  }
}
