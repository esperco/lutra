/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.FilterList.tsx" />

module Esper.Actions {

  export interface FilterListJSON extends FilterStrJSON {
    labels: ListSelectJSON;
  }

  const analyticsId = "list-analytics-id";

  /* List action => render a list of events */
  export function renderFilterList(params: {
    cals: Calendars.CalSelection[];
    period: Period.Single;
  }, queryJSON: FilterListJSON) {

    // Async load of events
    _.each(params.cals, (cal) => Events2.fetchForPeriod({
      teamId: cal.teamId,
      calId: cal.calId,
      period: params.period
    }));

    // Render view
    render(<Views.FilterList
      cals={params.cals}
      period={params.period}
      labels={queryJSON.labels}
      filterStr={queryJSON.filterStr}
    />);

    /////

    // Delay tracking by 2 seconds to ensure user is actually looking at list
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.EventList, {
        calendars: params.cals.length,
        interval: params.period.interval,
        relativePeriod: Period.relativeIndex(params.period),
        hasFilterStr: !!queryJSON.filterStr,
        hasLabelFilter: !queryJSON.labels.all
      });
    }, 2000);
  }

}
