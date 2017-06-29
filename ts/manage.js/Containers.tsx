/*
  Simple bindings of Components to data sources
*/

module Esper.Containers {
  export function calendarListModal(teamId: string) {
    return ReactHelpers.contain(function() {
      var team = Stores.Teams.get(teamId).unwrapOr(null);
      var available = Stores.Calendars.listAvailable(teamId).unwrapOr(null);
      var selected = Stores.Calendars.list(teamId).unwrapOr(null);

      var busy = Stores.Teams.TeamStore.get(teamId).mapOr(true,
        (d) => d.dataStatus === Model2.DataStatus.FETCHING
      ) || Stores.Calendars.ListStore.get(teamId).mapOr(true,
        (d) => d.dataStatus === Model2.DataStatus.FETCHING
      ) || Stores.Calendars.AvailableStore.get(teamId).mapOr(true,
        (d) => d.dataStatus === Model2.DataStatus.FETCHING);

      var error = Stores.Teams.TeamStore.get(teamId).mapOr(false,
        (d) => d.dataStatus === Model2.DataStatus.FETCH_ERROR
      ) || Stores.Calendars.ListStore.get(teamId).mapOr(false,
        (d) => d.dataStatus === Model2.DataStatus.FETCH_ERROR
      ) || Stores.Calendars.AvailableStore.get(teamId).mapOr(false,
        (d) => d.dataStatus === Model2.DataStatus.FETCH_ERROR);

      return <Components.CalendarListModal
        title="Edit Shared Calendars"
        isBusy={busy}
        hasError={error}
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
