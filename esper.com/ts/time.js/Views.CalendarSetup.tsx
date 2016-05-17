/*
  View to have new users select calendar
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Calendars.ts" />
/// <reference path="../lib/Stores.Teams.ts" />

module Esper.Views {

  interface Props {
    teamId: string; // Init only
  }

  interface State {  }

  export class CalendarSetup extends ReactHelpers.Component<Props, State> {
    renderWithData() {
      var disableNext = !_.find(Stores.Teams.all(),
        (t) => t.team_timestats_calendars.length);
      var hasExec = !!_.find(Stores.Teams.all(),
        (t) => t.team_executive !== Login.myUid());
      var busy =  !!_.find(Stores.Teams.allIds(), (_id) =>
        Stores.Calendars.ListStore.get(_id).match({
          none: () => false,
          some: (data) => data.dataStatus === Model.DataStatus.INFLIGHT
        })
      );

      // Make ApiC calls here so they're registered by tracker
      _.each(Stores.Teams.allIds(), (_id) => availableCalendars(_id));

      return <Components.OnboardingPanel heading={Text.CalendarSetupHeading}
              progress={3/3} busy={busy}
              backPath={Paths.Time.labelSetup().href}
              disableNext={disableNext}
              onNext={() => this.onNext()}>
        <div className="alert alert-info">
          { hasExec ?
            Text.CalendarSetupExecDescription :
            Text.CalendarSetupSelfDescription }
        </div>

        <Components.OnboardingTeams
          teams={Stores.Teams.all()}
          initOpenId={this.props.teamId}
          renderFn={(t) => this.renderCalendarForm(t)}
          onAddTeam={() => Route.nav.path("team-setup")}
        />

        <div className="alert">
          Can't find the calendar you're looking for? Please
          {" "}<a href="/contact">contact us</a> for help.
        </div>
      </Components.OnboardingPanel>;
    }

    renderCalendarForm(team: ApiT.Team) {
      return <CalendarList
        calendarListId={team.teamid}
        team={team}
        calendarStatus={availableCalendarsStatus(team.teamid)}
        selectedCalendars={selectedCalendars(team.teamid)}
        availableCalendars={availableCalendars(team.teamid)}
      />;
    }

    onNext() {
      Route.nav.path("charts");
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
    team: ApiT.Team;
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
      var teamApproved = this.props.team.team_approved &&
        !!this.props.team.team_calendars.length;
      var isExec = Login.myUid() === this.props.team.team_executive;

      return <div className="calendar-list">
        { (Login.usesNylas() && !isExec && !teamApproved) ?

          // Not approved or no calendars shared
          <div className="esper-no-content">
            Waiting for calendar owner to grant access.
          </div> :

          // Approved (or not Nylas)
          <div>
            { calendars && calendars.length ?
              // Calendars
              <div className="esper-select-menu">
                { _.map(calendars, (c) => this.renderCalendar(c)) }
              </div> :

              // No calendars
              <div className="esper-no-content">
                No calendars found.{" "}
                { Login.usesNylas() ?
                  <span>
                    It may take a few minutes for your calendar provider
                    to sync with Esper. Please try{" "}
                    <a onClick={() => location.reload()}>
                      refreshing the page
                    </a>
                    {" "}in a few minutes.
                  </span> : null }
              </div>
            }
          </div>
        }
      </div>;
    }

    renderCalendar(cal: ApiT.GenericCalendar) {
      var selected = !!_.find(this.props.selectedCalendars,
        (c) => c.id === cal.id
      );
      return <a key={cal.id}
              onClick={() => this.toggleCalendar(cal, !selected)}
              className={classNames("esper-selectable", {
                "active": selected
              })}>
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
}
