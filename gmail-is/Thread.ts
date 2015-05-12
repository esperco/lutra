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
        return List.unique(allEmails);
      });
  }

  function getTeamEmails(teams: ApiT.Team[]):
  JQueryPromise<TeamEmails[]> {

    /*
      It looks TypeScript selects the wrong prototype for .then(), resulting
      in what it thinks is a JQueryPromise<JQueryPromise<...>>.
      The <any> cast fixes it. (Promises are flattened automatically, so
      JQueryPromise<JQueryPromise<<A>> ≅ JQueryPromise<A>.)
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
      if (List.mem(emailAddresses, msg.from_email)) {
        return true;
      }
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
    var myUid = Login.myUid();
    Log.d("Detect team: Input", thread, teamEmailsList);
    var filteredTeams =
      List.filter(teamEmailsList, function(teamEmails) {
        /*
          We require both the executive and an assistant to have their
          known email addresses present in the thread.

          Being an assistant in that team lifts the requirement of having
          my email address show up in the thread (I could be Bcc'd or
          may have received the email on an alias unknown to Esper).
        */
        var threadMembers = thread.people_involved;
        var executive = List.find(threadMembers, function(nameEmail) {
          return List.mem(teamEmails.executive, nameEmail[1]);
        });
        var assistant = List.find(threadMembers, function(nameEmail) {
          return List.mem(teamEmails.assistants, nameEmail[1]);
        });

        var team = teamEmails.team;
        var amExecutive = team.team_executive === myUid;
        var amAssistant = List.mem(team.team_assistants, myUid) && !amExecutive;
          /*
            We make sure to not select test teams where I'm both
            executive and assistant.
          */

        var selected =
          executive !== null && (assistant !== null || amAssistant);
        return selected;
      });
    if (filteredTeams.length > 0) {
      var candidates = List.map(filteredTeams, function(teamEmails) {
        var hasMsgFromExec = hasMessageFrom(thread, teamEmails.executive);
        return {
          team: teamEmails.team,
          hasMsgFromExec: hasMsgFromExec
        };
      });

      var candidatesWithMessageFromExec =
        List.filter(candidates, function(x: DetectedTeam) {
          return x.hasMsgFromExec;
        });

      /* This is an arbitrary choice if more than one team matches */
      var detected = candidatesWithMessageFromExec.length > 0 ?
        candidatesWithMessageFromExec[0] :
        candidates[0];

      Log.d("Detect team: Candidate teams", candidates);
      Log.d("Detect team: Better candidates", candidatesWithMessageFromExec);
      Log.d("Detect team: Selected team", detected);

      return detected;
    }
    else {
      Log.d("Detect team: No team detected");
      return;
    }
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
