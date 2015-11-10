/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    selectedTeamId: string;
    selectedCalId: string;
    updateFn: (teamId: string, calId: string) => void
  }

  interface CalSelectorState {
    teams: ApiT.Team[]; // Includes calendars
  }

  export class CalSelector extends
    Component<CalSelectorProps, CalSelectorState>
  {
    render() {
      return <div className="esper-borderless-section">
        <h4 className="esper-header">
          <i className="fa fa-fw fa-calendar"></i>{" "}
          Select Calendar
        </h4>
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
        var calId = Calendars.getId(calendar);

        var classes = ["list-group-item", "one-line"];
        if (this.props.selectedCalId === calId &&
            this.props.selectedTeamId === teamId) {
          classes.push("active");
        }

        return (
          <a key={teamId + " " + calId} className={classes.join(" ")}
             onClick={() => this.props.updateFn(teamId, calId)}>
            <i className="fa fa-fw fa-calendar-o"></i>
            {" " + calendar.calendar_title}
          </a>);
      });
    }

    componentDidMount() {
      this.setSources([Login.InfoStore]);
    }

    getState() {
      var loginInfo = Login.InfoStore.val();
      return {
        teams: (loginInfo && loginInfo.teams) || []
      };
    }
  }
}