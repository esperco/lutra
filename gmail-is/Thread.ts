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

  function findTeamInThread(thread: esperGmail.get.Thread,
                            teamEmailsList: TeamEmails[]):
  ApiT.Team {
    var team;
    var filteredTeams =
      List.filter(teamEmailsList, function(teamEmails) {
        var threadMembers = thread.people_involved;
        var execOrAsst = List.find(threadMembers, function(nameEmail) {
          var email = nameEmail[1];
          return List.mem(teamEmails.assistants, email) ||
                 List.mem(teamEmails.executive, email);
        });
        return execOrAsst !== null;
      });
    if (filteredTeams.length > 0) {
      /* Arbitrary choice if more than one team matches */
      return filteredTeams[0].team;
    }
    else
      return;
  }

  export function detectTeam(teams: ApiT.Team[],
                             thread: esperGmail.get.Thread):
  JQueryPromise<ApiT.Team> {

    return getTeamEmails(teams)
      .then(function(teamEmailsList) {
        return findTeamInThread(thread, teamEmailsList);
      });
  }
}
