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

  /* List action => render a list of events */
  export function renderFilterList(params: {
    teamId: string;
    calIds: string[];
    period: Period.Single;
  }, queryJSON: FilterListJSON) {

    // Async load of events
    _.each(params.calIds, (calId) => Events2.fetchForPeriod({
      teamId: params.teamId,
      calId: calId,
      period: params.period
    }));

    // Render view
    render(<Views.FilterList
      teamId={params.teamId}
      calIds={params.calIds}
      period={params.period}
      labels={queryJSON.labels}
      filterStr={queryJSON.filterStr}
    />);

    /////

    Analytics.page(Analytics.Page.EventList, {
      calendars: params.calIds.length,
      teamId: params.teamId,
      interval: params.period.interval,
      relativePeriod: Period.relativeIndex(params.period),
      hasFilterStr: !!queryJSON.filterStr,
      hasLabelFilter: !queryJSON.labels.all
    });
  }

}
