/*
  View to have new users select calendar
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.ModalPanel.tsx" />
/// <reference path="../lib/Components.SelectMenu.tsx" />
/// <reference path="../lib/Actions.Calendars.ts" />
/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="../lib/Stores.Calendars.ts" />

module Esper.Views {

  export class CalendarManage extends ReactHelpers.Component<{
    teamId: string;
  }, {}> {
    renderWithData() {
      var metadataOpt = Stores.Calendars.ListStore.get(this.props.teamId);
      var busy = metadataOpt.match({
        none: () => false,
        some: (m) => m.dataStatus === Model.DataStatus.INFLIGHT
      });
      var error = metadataOpt.match({
        none: () => false,
        some: (m) => m.dataStatus === Model.DataStatus.PUSH_ERROR ||
                     m.dataStatus === Model.DataStatus.FETCH_ERROR
      });

      return <div className="container"><div className="row">
        <div className="col-sm-offset-2 col-sm-8">
          <div className="panel panel-default">
            <div className="panel-body">
              <Components.ModalPanel busy={busy} error={error}
                disableCancel={Onboarding.needsCalendars()}
                cancelText={"Done"} onCancel={() => Route.nav.home()}
              >
                <div className="alert alert-info">
                  Which calendars do you use to track your time?
                </div>
                <TeamSelector
                  teams={Stores.Teams.all()}
                  selectedId={this.props.teamId}
                />
                <CalendarList
                  calendarListId={this.props.teamId}
                  selectedTeam={Stores.Teams.get(this.props.teamId)}
                  calendarStatus={availableCalendarsStatus(this.props.teamId)}
                  selectedCalendars={selectedCalendars(this.props.teamId)}
                  availableCalendars={availableCalendars(this.props.teamId)}
                />
              </Components.ModalPanel>
            </div>
          </div>
        </div>
      </div></div>;
    }
  }


  //////

  function selectedCalendars(teamId: string) {
    return Stores.Calendars.list(teamId).match({
      none: (): ApiT.GenericCalendar[] => [],
      some: (list) => list
    })
  }

  function availableCalendars(teamId: string) {
    return Option.cast(calStore.val(calKey(teamId))).match({
      none: (): ApiT.GenericCalendar[] => [],
      some: (c) => c.calendars
    });
  }

  function availableCalendarsStatus(teamId: string) {
    return Option.cast(calStore.metadata(calKey(teamId))).match({
      none: () => Model.DataStatus.FETCHING,
      some: (m) => m.dataStatus
    });
  }

  function calKey(teamId: string) {
    return ApiC.getGenericCalendarList.strFunc([teamId]);
  }
  var calStore = ApiC.getGenericCalendarList.store;


  /////

  class CalendarList extends ReactHelpers.Component<{
    calendarListId: string;
    selectedTeam: Option.T<ApiT.Team>;
    calendarStatus: Model.DataStatus;
    selectedCalendars: ApiT.GenericCalendar[];
    availableCalendars: ApiT.GenericCalendar[];
  }, {}> {

    render() {
      var status = this.props.calendarStatus;
      if (status === Model.DataStatus.FETCH_ERROR ||
          status === Model.DataStatus.PUSH_ERROR) {
        return <Components.ErrorMsg />;
      }

      else if (status !== Model.DataStatus.READY &&
               status !== Model.DataStatus.UNSAVED)
      {
        return <div className="esper-spinner esper-centered esper-medium" />;
      }

      var calendars = this.props.availableCalendars;
      var teamApproved = this.props.selectedTeam.match({
        none: () => false,
        some: (t) => t.team_approved && !!t.team_calendars.length
      });
      var isExec = this.props.selectedTeam.match({
        none: () => true,
        some: (t) => Login.myUid() === t.team_executive
      });

      return <div>
        { (Login.usesNylas() && !isExec && !teamApproved) ?

          // Not approved or no calendars shared
          <div className="esper-no-content">
            Waiting for calendar owner to grant access.
          </div> :

          // Approved (or not Nylas)
          <div>
            { calendars && calendars.length ?
              // Calendars
              <div>
                <label>Select Calendars</label>
                <div className="list-group">
                  { _.map(calendars, (c) => this.renderCalendar(c)) }
                </div>
              </div> :

              // No calendars
              <div className="esper-no-content">
                No calendars found
              </div>
            }
          </div>
        }
        <div className="alert">
          Can't find the calendar you're looking for? Please
          {" "}<a href="/contact">contact us</a> for help.
        </div>
      </div>;
    }

    renderCalendar(cal: ApiT.GenericCalendar) {
      var selected = !!_.find(this.props.selectedCalendars,
        (c) => c.id === cal.id
      );
      return <a key={cal.id}
              onClick={() => this.toggleCalendar(cal, !selected)}
              className={"list-group-item" + (selected ?
                         " list-group-item-success" : "")}>
        <i className={"fa fa-fw " + (selected ?
                      "fa-calendar-check-o" : "fa-calendar-o")} />{" "}
        {cal.title}
      </a>;
    }

    toggleCalendar(cal: ApiT.GenericCalendar, selected: boolean) {
      if (selected) {
        Actions.Calendars.add(this.props.calendarListId, cal);
      } else {
        Actions.Calendars.remove(this.props.calendarListId, cal);
      }
    }
  }


  /////////

  function TeamSelector({teams, selectedId}: {
    teams: ApiT.Team[];
    selectedId?: string;
  }) {
    var selectId = "calendar-setup-team-select";
    if (teams.length > 1) {
      return <div className="form-group">
        <label htmlFor={selectId} className="control-label">
          Managing Time For &hellip;
        </label>
        <Components.SelectMenu
          options={_.map(teams, (t) => ({
            val: t.teamid,
            display: <span>
              <i className="fa fa-fw fa-user" />
              {" "}{ t.team_name }
            </span>
          }))}
          selected={selectedId}
          onChange={(id) => changeTeam(id)}
        />
      </div>;
    }
    return <span />;
  }

  function changeTeamPromise(p: JQueryPromise<ApiT.Team>) {
    p.done((team) => changeTeam(team.teamid));
  }

  function changeTeam(teamId?: string) {
    Route.nav.path("/calendar-manage" + (teamId ? "/" + teamId : ""));
  }
}
