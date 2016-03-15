/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.FilterList.tsx" />

module Esper.Actions {

  /* List action => render a list of events */
  export function renderFilterList(params?: EventFilterJSON) {
    params = cleanEventFilterQuery(params);
    var start = new Date(params.start);
    var end = new Date(params.end);

    // Trigger async load
    _.each(params.cals, (c) =>
      Events.fetch(c.teamId, c.calId, start, end)
    );

    var labels = _.filter(params.labels, (l) => _.isString(l));
    var unlabled = !!params.unlabeled;
    var allLabels = !!params.allLabels;

    // Default => select all
    if (_.isUndefined(params.labels) &&
        _.isUndefined(params.unlabeled) &&
        _.isUndefined(params.allLabels))
    {
      allLabels = true;
      unlabled = true;
    }

    var filterStr = params.filterStr || "";
    render(<Views.FilterList
      calendars={params.cals}
      start={start}
      end={end}
      filterStr={filterStr}
      labels={labels}
      unlabeled={unlabled}
      allLabels={allLabels}
    />);

    /////

    var duration = moment.duration(end.getTime() - start.getTime()).humanize();
    var startStr = moment(start).fromNow();
    Analytics.page(Analytics.Page.EventList, {
      calendars: params.cals.length,
      allLabels: allLabels,
      unlabeled: unlabled,
      numLabels: labels.length,
      filterStr: filterStr,
      periodLength: duration,
      start: startStr
    });
  }

}
