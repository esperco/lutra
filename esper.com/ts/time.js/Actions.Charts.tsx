/*
  Actions for charts page
*/

module Esper.Actions.Charts {
  // Fetch events from server
  function fetchEvents(o: Types.ChartParams): JQueryPromise<any> {
    let { teamId, period } = o;
    return Stores.Events.fetchPredictions({ teamId, period });
  }

  // Get events from store
  function getEvents(o: Types.ChartParams): Types.EventsForRangesData {
    return Stores.Events.require({
      period: o.period,
      cals: _.map(o.extra.calIds, (calId) => ({
        teamId: o.teamId, calId
      }))
    });
  }

  // Called before each chart path funciton
  function initChart(o: Types.ChartParams) {
    fetchEvents(o);
    trackChart(o);
  }


  /* Analytics */

  var analyticsId = "chart-analytics-id";

  function trackChart(o: Types.ChartParams) {
    /*
      Determine group based on path -- we assume all chart routes start with
      the chart prefix
    */
    var prefix = Paths.Time.charts().hash;
    var sliced = Route.current.slice(prefix.length);
    var parts = sliced.split("/");

    // If [0] is empty (path started with "/"), go to next
    var group = parts[0] || parts[1];

    // Delay tracking by 2 seconds to ensure user is actually looking at chart
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.TimeStatsCharts, {
        group: group,
        type: o.extra.type,
        params: o.extra,
        interval: o.period.interval
      });
    }, 2000);
  }


  /* Rendering */

  function renderChart(o: Types.ChartParams, groupBy: Types.GroupBy) {
    // Group-specific cleaning
    o.extra = Charting.cleanGroups(o.extra, o.teamId, groupBy);

    // Fetching
    initChart(o);

    render(ReactHelpers.contain(function() {
      getEvents(o);
      let { eventsForRanges, hasError, isBusy } = getEvents(o);
      let props: Types.ChartProps = {
        groupBy: groupBy,
        extra: o.extra,
        period: o.period,
        team: Stores.Teams.require(o.teamId),
        calendars: Stores.Calendars.list(o.teamId).unwrapOr([]),
        eventsForRanges, hasError, isBusy
      };

      return <Views.Charts { ...props } />
    }));
  }


  /* Duration Charts */
  export function renderDurations(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByDuration);
  }

  /* Calendars Charts */
  export function renderCalendars(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByCalendar);
  }

  /* Domain Chart */
  export function renderDomains(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByDomain);
  }

  /* Guest Charts */
  export function renderGuests(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByGuest);
  }

  /* Guest Count Charts */
  export function renderGuestsCount(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByGuestCount);

  }

  /* Label Charts */
  export function renderLabels(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByLabel);
  }

  /* Rating Charts */
  export function renderRatings(o: Types.ChartParams) {
    renderChart(o, Charting.GroupByRating);
  }
}
