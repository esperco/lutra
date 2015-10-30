/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Pass a store for managing selected team and calendar
  export interface CalSelection {
    teamId: string;
    calId: string;
  }

  interface CalSelectorProps {
    store: Model.StoreOne<CalSelection>;
  }

  interface CalSelectorState {
    selectedTeamId: string;
    selectedCalId: string;
    teams: ApiT.Team[]; // Includes calendars
  }

  export class CalSelector extends
    Component<CalSelectorProps, CalSelectorState>
  {
    render() {
      return <div className="esper-borderless-section">
        <h4 className="esper-header">Select Calendar</h4>
        <div className="esper-content">
        {
          this.state.teams.length ?
          this.renderTeams(this.state.teams) :
          "No Teams Found"
        }
        </div>
      </div>;
    }

    renderTeams(teams: ApiT.Team[]) {
      return _.map(teams, (team) =>
        <div key={team.teamid}>
          <h5 className="esper-subheader">{team.team_name}</h5>
          <div className="list-group">
            {this.renderCalendars(team.teamid, team.team_calendars)}
          </div>
        </div>);
    }

    renderCalendars(teamId: string, calendars: ApiT.Calendar[]) {
      return _.map(calendars, (calendar) => {
        // NB: When we bring in Nylas integration, need to use key other
        // than google_cal_id
        var calId = calendar.google_cal_id;

        var classes = ["list-group-item", "one-line"];
        if (this.state.selectedCalId === calId &&
            this.state.selectedTeamId === teamId) {
          classes.push("active");
        }

        return (
          <a key={teamId + " " + calId} className={classes.join(" ")}
              onClick={() => this.props.store.set({
                teamId: teamId, calId: calId
              })}>
            <i className="fa fa-fw fa-calendar-o"></i>
            {" " + calendar.calendar_title}
          </a>);
      });
    }

    componentDidMount() {
      this.setSources([Login.InfoStore, this.props.store]);
    }

    getState() {
      var loginInfo = Login.InfoStore.val();
      var selected = this.props.store.val();
      return {
        selectedTeamId: selected && selected.teamId,
        selectedCalId: selected && selected.calId,
        teams: (loginInfo && loginInfo.teams) || []
      };
    }
  }
}