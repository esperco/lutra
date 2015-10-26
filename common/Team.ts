/*
  Functions to access a team without making assumptions on its
  internal structure (e.g. things like "can the executive be
  listed as an assistant too?")

  This module depends on the type definition for a team, given
  in ApiT. Eventually it should be shared by stoat and otter.
*/
module Esper.Team {
  export function isExecutive(uid: string, team: ApiT.Team): boolean {
    return uid === team.team_executive;
  }

  export function isAssistant(uid: string, team: ApiT.Team): boolean {
    return List.mem(team.team_assistants, uid);
  }

  export function members(team: ApiT.Team): string[] {
    var teamMembers = List.copy(team.team_assistants);
    var executive = team.team_executive;
    if (! List.mem(teamMembers, executive)) {
      teamMembers.push(executive);
    }
    return teamMembers;
  }
}
