/*
  Drop-up menu for switching teams from sidebar
*/

module Esper.Components {

  export function TeamSelector({teams, selectedId, onUpdate}: {
    teams: ApiT.Team[];
    selectedId: string;
    onUpdate: (teamId: string) => void;
  }) {
    var selectedTeam = _.find(teams, (t) => t.teamid === selectedId);
    var displayName = selectedTeam ? selectedTeam.team_name : Text.NoTeam;

    return <DropdownModal className="team-selector">
      <div className="dropdown-toggle clearfix">
        { displayName }
        <span className="pull-right">
          <i className="fa fa-fw fa-caret-up" />
        </span>
      </div>
      <div className="dropdown-menu team-selector-menu">
        <div className="esper-select-menu">
          { _.map(teams, (team) =>
            <div key={team.teamid}
                 className="clearfix esper-selectable"
                 onClick={() => onUpdate(team.teamid)}>
              <i className="fa fa-fw fa-user" />{" "}
              { team.team_name }
              { team.teamid === selectedId ?
                <span className="pull-right">
                  <i className="fa fa-fw fa-check" />
                </span> : null
              }
            </div>
          )}
        </div>
        <div className="esper-select-menu">
          <a className="esper-selectable"
             href={Paths.Manage.Team.general({}).href}>
            <i className="fa fa-fw fa-users" />{" "}
            { Text.ManageTeams }
          </a>
        </div>
      </div>
    </DropdownModal>
  }

}
