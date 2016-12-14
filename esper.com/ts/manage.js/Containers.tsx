/*
  Simple bindings of Components to data sources
*/

module Esper.Containers {
  export function calendarListModal(teamId: string) {
    return ReactHelpers.contain(function() {
      var team = Stores.Teams.get(teamId).unwrapOr(null);
      var available = Stores.Calendars.listAvailable(teamId).unwrapOr(null);
      var selected = Stores.Calendars.list(teamId).unwrapOr(null);

      return <Components.CalendarListModal
        title="Edit Shared Calendars"
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
