/*
  Operations on Gmail threads
*/
module Esper.Thread {

  interface TeamEmails {
    team: ApiT.Team;
    executive: string[]; // email
    assistants: string[]; // email
  }

  function getEmail(uid: string, teamid: string) {
    return Profile.get(uid, teamid)
      .then(function(profile) {
        var allEmails = [profile.email].concat(profile.other_emails);
        return List.unique(allEmails, undefined);
      });
  }

  function getTeamEmails(teams: ApiT.Team[]):
  JQueryPromise<TeamEmails[]> {

    /*
      It looks TypeScript selects the wrong prototype for .then(), resulting
      in what it thinks is a JQueryPromise<JQueryPromise<...>>.
      The <any> cast fixes it.
    */
    return <any> Login.getLoginInfo
      .then(function(loginInfo) {
        return Promise.join(
          List.map(loginInfo.teams, function(team) {
            return getEmail(team.team_executive, team.teamid)
              .then(function(executiveEmails) {
                return Promise.join(
                  List.map(team.team_assistants, function(assistantUid) {
                    return getEmail(assistantUid, team.teamid);
                  })
                ).then(function(assistantEmails) {
                  return {
                    team: team,
                    executive: executiveEmails,
                    assistants: List.concat(assistantEmails)
                  };
                });
              });
          })
        );
      });
  }

  function hasMessageFrom(thread: esperGmail.get.Thread,
                          emailAddresses: string[]):
  boolean {
    var messages = thread.threads;
    for (var k in messages) {
      var msg: esperGmail.get.Message = messages[k];
      if (List.mem(emailAddresses, msg.from_email))
        return true;
    }
    return false;
  }

  export interface DetectedTeam {
    team: ApiT.Team;
    hasMsgFromExec: boolean;
  }

  function findTeamInThread(thread: esperGmail.get.Thread,
                            teamEmailsList: TeamEmails[]):
  DetectedTeam {
    var team;
    var filteredTeams =
      List.filter(teamEmailsList, function(teamEmails) {
        var threadMembers = thread.people_involved;
        var executive = List.find(threadMembers, function(nameEmail) {
          return List.mem(teamEmails.executive, nameEmail[1]);
        });
        var assistant = List.find(threadMembers, function(nameEmail) {
          return List.mem(teamEmails.assistants, nameEmail[1]);
        });
        return executive !== null && assistant !== null;
      });
    if (filteredTeams.length > 0) {
      /* This is an arbitrary choice if more than one team matches */
      var teamEmails = filteredTeams[0];
      var hasMsgFromExec = hasMessageFrom(thread, teamEmails.executive);
      return {
        team: teamEmails.team,
        hasMsgFromExec: hasMsgFromExec
      };
    }
    else
      return;
  }

  export function detectTeam(teams: ApiT.Team[],
                             thread: esperGmail.get.Thread):
  JQueryPromise<DetectedTeam> {

    return getTeamEmails(teams)
      .then(function(teamEmailsList) {
        return findTeamInThread(thread, teamEmailsList);
      });
  }
}
