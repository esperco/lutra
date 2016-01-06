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

  export class CalSelector extends Component<CalSelectorProps, {}>
  {
    renderWithData() {
      var teams = Teams.all();
      var hasCalendars = !!_.find(teams, (t) => {
        var calList = Calendars.CalendarListStore.val(t.teamid);
        return calList && calList.length;
      });
      return <BorderlessSection icon="fa-calendar" title="Select Calendar"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
        { hasCalendars ?
          this.renderTeams(teams) :
          <div className="esper-no-content">No Calendars Available</div>
        }
        <div className="esper-subsection-footer">
          <a onClick={this.editCalendars.bind(this)}>
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
      return _.map(teams, (team) => {
        var calList = Calendars.CalendarListStore.val(team.teamid);
        if (! (calList && calList.length)) {
          return <span key={team.teamid} />;
        }

        return <div key={team.teamid}>
          {
            teams.length > 1 ?
            <h5 className="esper-subheader">{team.team_name}</h5> :
            ""
          }
          <div className="list-group">
            {
              Teams.dataStatus(team.teamid) === Model.DataStatus.READY ?
              this.renderCalendars(team.teamid, calList) :
              <div className="esper-spinner" />
            }
          </div>
        </div>;
      });
    }

    renderCalendars(teamId: string, calendars: ApiT.GenericCalendar[]) {
      return _.map(calendars, (calendar) => {
        var calId = calendar.id;
        var classes = ["list-group-item", "one-line"];
        if (this.props.selectedCalId === calId &&
            this.props.selectedTeamId === teamId) {
          classes.push("active");
        }

        return (
          <a key={teamId + " " + calId} className={classes.join(" ")}
             onClick={() => this.props.updateFn(teamId, calId)}>
            <i className="fa fa-fw fa-calendar-o"></i>
            {" " + calendar.title}
          </a>);
      });
    }
  }
}