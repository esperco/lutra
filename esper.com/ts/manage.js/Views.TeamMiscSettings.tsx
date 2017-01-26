/*
  General settings page
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamMiscSettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.misc;

    renderMain(team: ApiT.Team) {
      return <div>
        <RemoveTeam team={team} />
      </div>;
    }
  }


  /* Deactivate Account */

  function RemoveTeam({team} : {team: ApiT.Team}) {
    return <div className="panel panel-default">
      <div className="panel-body clearfix">
        <span className="control-label esper-input-align">
          { Text.removeTeamDescription(team.team_name) }
        </span>
        <button className="pull-right btn btn-danger"
          onClick={() => removeTeam(team)}>
          { Text.RemoveTeamBtn }
        </button>
      </div>
    </div>;
  }

  function removeTeam(team: ApiT.Team) {
    Actions.Teams.removeTeam(team.teamid);
    Route.nav.go(Paths.Manage.Team.general());
  }
}




