/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../lib/Analytics.Web.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="../lib/Stores.Calendars.ts" />
/// <reference path="./Views.CalendarLabeling.tsx" />

module Esper.Actions {

  export function renderCalendarLabeling(
    cals: Stores.Calendars.CalSelection[],
    period: Period.Single
  ) {

    // Fetch
    var teamIds = _.uniq(_.map(cals, (c) => c.teamId));
    _.each(teamIds, (teamId) => Events2.fetchPredictionsForPeriod({
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
