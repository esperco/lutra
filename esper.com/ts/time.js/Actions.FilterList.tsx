/*
  Actions for filter list
*/

module Esper.Actions {

  const analyticsId = "list-analytics-id";

  /* List action => render a list of events */
  export function renderFilterList(params: {
    cals: Stores.Calendars.CalSelection[];
    period: Period.Single;
  }, queryJSON: Params.FilterListJSON) {

    // Async load of events
    var teamIds = _.uniq(_.map(params.cals, (c) => c.teamId));
    _.each(teamIds, (teamId) => Stores.Events.fetchPredictions({
      teamId: teamId,
      period: params.period
    }));

    // Render view
    render(<Views.FilterList
      cals={params.cals}
      period={params.period}
      labels={queryJSON.labels}
      filterStr={queryJSON.filterStr}
      unconfirmed={queryJSON.unconfirmed}
    />, <Views.Header active={Views.Header_.Tab.List} />);

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
