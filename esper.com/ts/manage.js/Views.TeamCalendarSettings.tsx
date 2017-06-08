/*
  Calendar settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {
  export class TeamCalendarSettings extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.calendars;

    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <div className="alert alert-info text-center">
            { team.team_executive === Login.myUid() ?
              Text.CalendarSettingsSelfDescription :
              Text.CalendarSettingsExecDescription }
          </div>

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
              this.toggleEventLink(prefs)}>
            <Components.Tooltip title={Text.EsperLinkDescription}>
              <i className={classNames("fa fa-fw fa-left", {
                "fa-check-square-o": prefsWithDefaults.event_link,
                "fa-square-o": !prefsWithDefaults.event_link
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
  }
}
