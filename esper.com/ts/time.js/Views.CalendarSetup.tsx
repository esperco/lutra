/*
  View to have new users select calendar
*/

module Esper.Views {

  interface Props {
    teamId: string; // Init only
  }

  interface State {  }

  export class CalendarSetup extends ReactHelpers.Component<Props, State> {
    renderWithData() {
      var hasExec = !!_.find(Stores.Teams.all(),
        (t) => t.team_executive !== Login.myUid());
      var busy =  !!_.find(Stores.Teams.allIds(), (_id) =>
        Stores.Calendars.ListStore.get(_id).match({
          none: () => false,
          some: (data) => data.dataStatus === Model2.DataStatus.INFLIGHT
        })
      );

      // Call render form here so it's tracked by view's tracking system
      var calendarsForTeam: {[index: string]: JSX.Element} = {};
      _.each(Stores.Teams.all(), (t) => {
        calendarsForTeam[t.teamid] = this.renderCalendarForm(t);
      });

      return <Components.OnboardingPanel heading={Text.CalendarSetupHeading}
              progress={3/3} busy={busy}
              backPath={Paths.Time.teamSetup().href}
              onNext={() => this.onNext()}>
        <div className="alert alert-info">
          { hasExec ?
            Text.CalendarSetupExecDescription :
            Text.CalendarSetupSelfDescription }
        </div>

        <Components.OnboardingTeams
          teams={Stores.Teams.all()}
          initOpenId={this.props.teamId}
          renderFn={(t) => calendarsForTeam[t.teamid]}
          onAddTeam={() => Route.nav.go(Paths.Time.teamSetup())}
        />

        <div className="alert">
          Can't find the calendar you're looking for? Please
          {" "}<a href="/contact">contact us</a> for help.
        </div>
      </Components.OnboardingPanel>;
    }

    renderCalendarForm(team: ApiT.Team) {
      return Stores.Calendars.listAvailable(team.teamid).join(
        Stores.Calendars.list(team.teamid),
        (available, selected) => Option.cast({
          available: available, selected: selected
        })
      ).match({
        none: () => <div className="esper-spinner esper-centered" />,
        some: ({available, selected}) =>
          <Components.CalendarList
            team={team}
            availableCalendars={available}
            selectedCalendars={selected}
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
            selectedItemClasses="active"
          />
      });
    }

    onNext() {
      Route.nav.go(Paths.Time.labelSetup());
    }
  }
}
