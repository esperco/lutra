/*
  View to have new users select calendar
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.ModalPanel.tsx" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.RequestExec.tsx" />

module Esper.Views {

  // If no teams exist yet, use this as _id of the calendarList
  const newTeamCalendarListId: string = "NEW";

  export class CalendarSetup extends ReactHelpers.Component<{
    teamId: string;
  }, {}> {
    renderWithData() {
      var _id = this.props.teamId || newTeamCalendarListId;
      var metadataOpt = Option.cast(
        Calendars.CalendarListStore.metadata(_id)
      );
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
                  teams={Teams.all()}
                  selectedId={this.props.teamId}
                />
                <CalendarList
                  calendarListId={_id}
                  selectedTeam={Option.wrap(Teams.get(this.props.teamId))}
                  calendarStatus={allCalsStatus()}
                  selectedCalendars={selectedCalendars(_id)}
                  availableCalendars={availableCalendars(_id)}
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
    return Calendars.CalendarListStore.val(teamId) || [];
  }

  function availableCalendars(teamId: string) {
    return Option.cast(Teams.get(teamId)).match({
      none: () => allCals(),
      some: (t) => {
        if (Login.usesNylas() && Login.myUid() !== t.team_executive) {
          return _.map(t.team_calendars, Calendars.asGeneric);
        } else {
          return allCals();
        }
      }
    })
  }

  var allCalsKey = ApiC.getCalendarList.strFunc([]);
  var allCalsStore = ApiC.getCalendarList.store;

  function allCals() {
    return Option.cast(allCalsStore.val(allCalsKey))
      .match<ApiT.GenericCalendar[]>({
        none: () => [],
        some: (c) => _.map(c.calendars, Calendars.asGeneric)
      });
  }

  function allCalsStatus() {
    return Option.cast(allCalsStore.metadata(allCalsKey)).match({
      none: () => Model.DataStatus.READY,
      some: (m) => m.dataStatus
    });
  }


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
            { Login.usesNylas() && !isExec ?
              <div className="alert alert-warning">
                You do not have permission to add calendars for this
                account. You may remove calendars, but you will need the
                calendar owner to log in to re-grant access to access any
                calendars you have removed.
              </div> : null
            }
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
        <Components.RequestExec onSave={changeTeamPromise} />
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
        Calendars.addTeamCalendar(this.props.calendarListId, cal);
      } else {
        Calendars.removeTeamCalendar(this.props.calendarListId, cal);
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
        <select id={selectId || ""} className="form-control"
                value={selectedId}
                onChange={changeTeamEvent.bind(this)}>
          { _.map(teams, (t) =>
            <option key={t.teamid} value={t.teamid}>
              {t.team_name}
            </option>)
          }
        </select>
      </div>;
    }
    return <span />;
  }

  function changeTeamEvent(event: Event) {
    var target = event.target as HTMLOptionElement;
    changeTeam(target.value);
  }

  function changeTeamPromise(p: JQueryPromise<ApiT.Team>) {
    p.done((team) => changeTeam(team.teamid));
  }

  function changeTeam(teamId?: string) {
    Route.nav.path("/calendar-setup" + (teamId ? "/" + teamId : ""));
  }
}
