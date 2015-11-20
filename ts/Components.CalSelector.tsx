/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../marten/ts/ApiT.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Teams.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.Section.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    selectedTeamId: string;
    selectedCalId: string;
    updateFn: (teamId: string, calId: string) => void;
    minimized?: boolean;
    toggleMinimized?: () => void;
  }

  interface CalSelectorState {
    teams: ApiT.Team[]; // Includes calendars
  }

  export class CalSelector extends
    Component<CalSelectorProps, CalSelectorState>
  {
    render() {
      return <BorderlessSection icon="fa-calendar" title="Select Calendar"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
        { this.state.teams.length ?
          this.renderTeams(this.state.teams) :
          "No Teams Found"
        }
        <div className="esper-subsection-footer">
          <a href="#" onClick={this.editCalendars.bind(this)}>
            <i className="fa fa-fw fa-calendar-check-o" />{" "}
            Add / Remove Calendars
          </a>
        </div>
      </BorderlessSection>;
    }

    editCalendars() {
      Layout.renderModal(<CalAddModal />);
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
      this.setSources([Teams.teamStore]);
    }

    getState() {
      return {
        teams: Teams.all()
      };
    }
  }
}