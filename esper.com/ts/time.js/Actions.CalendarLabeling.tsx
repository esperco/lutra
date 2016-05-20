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
    _.each(teamIds, (teamId) => Stores.Events.fetchPredictionsForPeriod({
      teamId: teamId,
      period: period
    }));

    // Render
    render(<Views.CalendarLabeling
      cals={cals}
      period={period}
    />, <Views.Header active={Views.Header_.Tab.Calendar} />);
    Analytics.page(Analytics.Page.CalendarLabeling);
  }

}
