/*
  Calendar settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {
  interface State {
    isPlanLimited: boolean;
  }

  export class TeamCalendarSettings extends TeamSettings<State> {
    pathFn = Paths.Manage.Team.calendars;

    componentDidUpdate() {
      this.state = {
        isPlanLimited: false
      };
    }

    displayPlanLimitedMessage() {
      this.mutateState((s) => s.isPlanLimited = true);
    }

    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <div className="alert alert-info text-center">
            { team.team_executive === Login.myUid() ?
              Text.CalendarSettingsSelfDescription :
              Text.CalendarSettingsExecDescription }
          </div>
          { this.state.isPlanLimited ?
            <div className="alert alert-warning">
              { Text.CalendarLimitMsg(Config.getCalendarLimit(
                  team.team_api.team_subscription.plan)) }
            </div>
            : null
          }

          { Stores.TeamPreferences.get(team.teamid).mapOr(
              <div className="esper-spinner" />,
              (prefs) => this.renderOptions(prefs))
          }

          { this.renderCalendarList(team) }

          <div className="alert text-center">
            Can't find the calendar you're looking for? Please
            {" "}<a href={Paths.Landing.contact().href}>contact us</a>{" "}
            for help.
          </div>
        </div>
      </div>;
    }

    renderCalendarList(team: ApiT.Team) {
      return Stores.Calendars.listAvailable(team.teamid).join(
        Stores.Calendars.list(team.teamid),
        (available, selected) => Option.cast({available, selected})
      ).mapOr(<div className="esper-spinner" />, ({available, selected}) =>
        <Components.CalendarList
          team={team}
          onCalendarLimit={this.displayPlanLimitedMessage.bind(this)}
          limit={Config.getCalendarLimit(team.team_api.team_subscription.plan)}
          availableCalendars={available}
          selectedCalendars={selected}
          listClasses="list-group"
          itemClasses="list-group-item"
          selectedItemClasses="list-group-item-success"
        />
      );
    }

    renderOptions(prefs: ApiT.Preferences) {
      let prefsWithDefaults = Stores.TeamPreferences.withDefaults(prefs);
      return <div className="esper-section">
        <div className="esper-select-menu">
          <div className="esper-selectable" onClick={() =>
              this.toggleEventLink(prefsWithDefaults)}>
            <i className={classNames("fa fa-fw", {
              "fa-check-square-o": prefsWithDefaults.general.event_link,
              "fa-square-o": !prefsWithDefaults.general.event_link
            })} />
            { Text.EsperEventLink }
          </div>
        </div>
      </div>;
    }

    toggleEventLink(prefs: ApiT.Preferences) {
      Actions.TeamPreferences.toggleEsperEventLink(prefs);
    }
  }
}
