/*
  Operations on Gmail threads
*/
module Esper.Thread {

  function makeEmailTeamTable(teams: ApiT.Team[]):
  JQueryPromise<{ [email: string]: ApiT.Team }> {

    var tbl: { [email: string]: ApiT.Team } = {};

    /*
      It looks TypeScript selects the wrong prototype for .then(), resulting
      in what it thinks is a JQueryPromise<JQueryPromise<...>>.
      The <any> cast fixes it.
    */
    return <any> Login.getLoginInfo
      .then(function(loginInfo) {
        var jobs =
          List.map(loginInfo.teams, function(team) {
            var execUid = team.team_executive;
            return Profile.get(execUid, team.teamid)
              .then(function(execProfile) {
                tbl[execProfile.email] = team;
              });
          });

        return Promise.join(jobs)
          .then(function(voidList) {
            return tbl;
          });
      });
  }

  function findTeamInThread(thread: esperGmail.get.Thread,
                            tbl: { [email: string]: ApiT.Team }):
  ApiT.Team {
    var team;
    var nameEmail =
      List.find(thread.people_involved, function(nameEmail: string[]) {
        var email = nameEmail[1];
        team = tbl[email];
        return team !== undefined;
      });
    return team;
  }

  export function detectTeam(teams: ApiT.Team[],
                             thread: esperGmail.get.Thread):
  JQueryPromise<ApiT.Team> {

    return makeEmailTeamTable(teams)
      .then(function(tbl) {
        return findTeamInThread(thread, tbl);
      });
  }
}
