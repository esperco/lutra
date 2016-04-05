/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />

module Esper.Actions {

  export function renderCalendarLabeling(
    cals: Calendars.CalSelection[],
    period: Period.Single
  ) {

    // Fetch
    _.each(cals, (cal) => Events2.fetchForPeriod({
      teamId: cal.teamId,
      calId: cal.calId,
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
