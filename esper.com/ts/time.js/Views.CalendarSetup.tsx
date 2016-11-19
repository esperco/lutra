/*
  View to have new users select calendar
*/

module Esper.Views {

  interface Props {
    teamId: string; // Init only
  }

  interface State {  }

  export class CalendarSetup extends ReactHelpers.Component<Props, State> {
    _onboardingExpandos: Components.OnboardingTeams;
    _teamForms: { [index: string]: Components.CalendarList }

    constructor(props: Props) {
      super(props);
      this._teamForms = {};
    }

    renderWithData() {
      var hasExec = !!_.find(Stores.Teams.all(),
        (t) => t.team_executive !== Login.myUid());
      var busy =  !!_.find(Stores.Teams.allIds(), (_id) =>
        Stores.Calendars.ListStore.get(_id).mapOr(false,
          (data) => data.dataStatus === Model2.DataStatus.INFLIGHT)
      );

      // Call render form here so it's tracked by view's tracking system
      var calendarsForTeam: {[index: string]: JSX.Element} = {};
      _.each(Stores.Teams.all(), (t) => {
        calendarsForTeam[t.teamid] = this.renderCalendarForm(t);
      });

      return <Components.OnboardingPanel heading={Text.CalendarSetupHeading}
              subheading={ hasExec ?
                Text.CalendarSetupExecDescription :
                Text.CalendarSetupSelfDescription }
              progress={2/3} busy={busy}
              backPath={Paths.Time.teamSetup().href}
              onNext={() => this.onNext()}>

        <Components.OnboardingTeams
          ref={(c) => this._onboardingExpandos = c}
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
      ).mapOr(
        <div className="esper-spinner" />,
        ({available, selected}) => <div>
          <Components.CalendarList
            ref={(c) => this._teamForms[team.teamid] = c}
            team={team}
            availableCalendars={available}
            selectedCalendars={selected}
            className="esper-section esper-full-width"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
            selectedItemClasses="active"
          />

          { Stores.TeamPreferences.get(team.teamid).mapOr(
              <div className="esper-spinner" />,
              (prefs) => this.renderOptions(prefs))
          }
        </div>
      );
    }

    renderOptions(prefs: ApiT.Preferences) {
      if (prefs.event_link === undefined) {
        prefs = _.cloneDeep(prefs);
        prefs.event_link = true;
      }

      return <div className="esper-panel-section">
        <div className="esper-select-menu">
          <div className="esper-selectable" onClick={() =>
              this.toggleEventLink(prefs)}>
            <Components.Tooltip title={Text.EsperLinkDescription}>
              <i className={classNames("fa fa-fw fa-left", {
                "fa-check-square-o": prefs.event_link,
                "fa-square-o": !prefs.event_link
              })} />
              { Text.EsperEventLink }
              <span className="pull-right">
                <i className="fa fa-fw fa-question-circle" />
              </span>
            </Components.Tooltip>
          </div>
        </div>
      </div>;
    }

    toggleEventLink(prefs: ApiT.Preferences) {
      Actions.TeamPreferences.toggleEsperEventLink(prefs);
    }

    onNext() {
      var badTeamIds: string[] = [];

      _.each(this._teamForms, (f, _id) => {
        if (f) {
          if (f.validate().isNone()) {
            badTeamIds.push(_id);
          } else {
            let prefs = Stores.TeamPreferences.get(_id).unwrap();

            if (prefs.event_link === undefined) {
              prefs = _.cloneDeep(prefs);
              prefs.event_link = true;
            }
            Actions.TeamPreferences.setGeneral(_id, prefs);
          }
        }
      });

      if (badTeamIds.length) {
        this._onboardingExpandos.openTeams(badTeamIds, true);
      } else {
        Route.nav.go(Paths.Time.labelSetup());
      }
    }
  }
}
