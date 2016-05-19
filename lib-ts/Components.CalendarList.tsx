/*
  A list of calendars, for selection purposes
*/

/// <reference path="./Actions.Calendars.ts" />
/// <reference path="./Components.ListSelector.tsx" />

module Esper.Components {
  export class CalendarList extends ReactHelpers.Component<{
    team: ApiT.Team;
    selectedCalendars: ApiT.GenericCalendar[];
    availableCalendars: ApiT.GenericCalendar[];

    listClasses?: string;
    itemClasses?: string;
    selectedItemClasses?: string;
  }, {}> {

    render() {
      var calendars = this.props.availableCalendars;
      var teamApproved = this.props.team.team_approved &&
        !!this.props.team.team_calendars.length;
      var isExec = Login.myUid() === this.props.team.team_executive;

      var calChoices = _.map(calendars, (c) => ({
        id: c.id,
        displayAs: c.title
      }));
      var calSelected = _.map(this.props.selectedCalendars, (c) => c.id);

      return <div className="calendar-list">
        { (Login.usesNylas() && !isExec && !teamApproved) ?

          // Not approved or no calendars shared
          <div className="esper-no-content">
            Waiting for calendar owner to grant access.
          </div> :

          // Approved (or not Nylas)
          <div>
            { calendars && calendars.length ?

              <ListSelectorSimple
                choices={calChoices}
                selectedIds={calSelected}

                selectOption={ListSelectOptions.MULTI_SELECT}
                selectedIcon="fa-calendar-check-o"
                unselectedIcon="fa-calendar-o"

                listClasses={this.props.listClasses}
                itemClasses={this.props.itemClasses}
                selectedItemClasses={this.props.selectedItemClasses}

                updateFn={(ids) => this.update(ids)}
              /> :

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

    update(ids: string[]) {
      // Join all cals -> prioritize selected cals over available because
      // there may be settings and things tied to the selected ones
      var cals = _.unionBy(
        this.props.selectedCalendars,
        this.props.availableCalendars,
        (c) => c.id
      );
      cals = _.filter(cals, (c) => _.includes(ids, c.id))
      Actions.Calendars.update(this.props.team.teamid, cals);
    }
  }

}
