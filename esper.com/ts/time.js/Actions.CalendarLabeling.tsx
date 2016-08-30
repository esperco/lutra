/*
  Actions for calendar labeling page
*/

module Esper.Actions {

  export function renderCalendarLabeling(
    cals: Stores.Calendars.CalSelection[],
    period: Period.Single
  ) {

    // Fetch
    var teamIds = _.uniq(_.map(cals, (c) => c.teamId));
    _.each(teamIds, (teamId) => Stores.Events.fetchPredictions({
      teamId: teamId,
      period: period
    }));

    // Render
    render(<Views.CalendarLabeling
      cals={cals}
      period={period}
    />);
    Analytics.page(Analytics.Page.CalendarLabeling);
  }

}
