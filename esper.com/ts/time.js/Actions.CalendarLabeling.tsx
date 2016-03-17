/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.CalendarLabeling.tsx" />

module Esper.Actions {

  export function renderCalendarLabeling(params?: EventFilterJSON) {
    params = cleanEventFilterJSON(params);

    // At the moment, only calendar selection supported
    render(<Views.CalendarLabeling
      cals={params.cals}
    />);
    Analytics.page(Analytics.Page.CalendarLabeling);
  }

}
