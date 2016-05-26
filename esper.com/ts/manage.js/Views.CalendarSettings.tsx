/*
  Calendar settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class CalendarSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.calendars;

    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <div className="alert alert-info text-center">
            { team.team_executive === Login.myUid() ?
              Text.CalendarSettingsSelfDescription :
              Text.CalendarSettingsExecDescription }
          </div>

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
            listClasses="list-group"
            itemClasses="list-group-item"
            selectedItemClasses="list-group-item-success"
          />
      })
    }
  }
}
