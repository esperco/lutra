/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/AB.ts" />
/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <refernece path="./Actions" />
/// <reference path="./Charts.tsx" />
/// <reference path="./Views.Charts.tsx" />

module Esper.Actions {

  type ChartVariant =
    ["labels-bar", Charts.DurationsOverTime]|
    ["labels-pie", Charts.PercentageRecent]|
    ["labels-stack", Charts.PercentageOverTime]|
    ["activity", Charts.ActivityGrid]|
    ["top-guests", Charts.TopGuests]|
    ["guest-domains", Charts.GuestDomains]|
    ["durations", Charts.DurationHistogram]|
    ["availability", Charts.WorkHoursGrid];

  /*
    Make sure this matches first part of chart variant above. Not sure if
    there's a good way to have TypeScript check this automatically.
  */
  export type ChartId =
    "labels-bar"|
    "labels-pie"|
    "labels-stack"|
    "activity"|
    "top-guests"|
    "guest-domains"|
    "durations"|
    "availability";

  /* Display Info */

  export interface ChartTypeInfo {
    id: ChartId;
    displayAs: string;
    icon?: string;
  }

  var chartInfo: ChartTypeInfo[] = [{
    id: "labels-bar",
    icon: "fa-bar-chart",
    displayAs: "Labels Bar Chart"
  }, {
    id: "labels-pie",
    icon: "fa-pie-chart",
    displayAs: "Labels Pie Chart"
  }, {
    id: "labels-stack",
    icon: "fa-tasks fa-rotate-270",
    displayAs: "Labels Stacked Bar Chart"
  }, {
    id: "activity",
    icon: "fa-calendar",
    displayAs: "Activity Grid"
  }, {
    id: "top-guests",
    icon: "fa-align-left",
    displayAs: "Top Guests"
  }, {
    id: "guest-domains",
    icon: "fa-pie-chart",
    displayAs: "Guest Groups Pie Chart"
  }, {
    id: "durations",
    icon: "fa-bar-chart",
    displayAs: "Event Durations"
  }, {
    id: "availability",
    icon: "fa-calendar",
    displayAs: "Availability Grid"
  }]
  chartInfo = _.sortBy(chartInfo, (c) => c.displayAs);


  /* Analytics */

  // Analytics.page(Analytics.Page.TimeStatsCharts);



  ///////

  export function renderChart<T extends Charts.ChartJSON>
    (chartType?: string, chartJSON?: T)
  {
    chartType = chartType || getDefaultChartType();
    var chartVariant = getChart(chartType as ChartId, chartJSON);
    var chartId = chartVariant[0];
    var chart = chartVariant[1];
    chart.async();

    render(<Views.Charts
      currentChart={chart}
      chartId={chartId}
      chartTypes={chartInfo}
    />);

    // TODO: Analytics
  }

  function getDefaultChartType(): ChartId {
    if (AB.get(AB.TOP_GUESTS_SPLASH)) {
      return "top-guests";
    } else if (AB.get(AB.GUEST_DOMAINS_SPLASH)) {
      return "guest-domains";
    } else {
      return "labels-bar";
    }
  }

  function getChart<T extends Charts.ChartJSON>
    (chartType: ChartId, chartJSON?: T): ChartVariant
  {
    /*
      Type-checks on ChartId aren't working, so be careful with strings.

      Pending resolution of
      https://github.com/Microsoft/TypeScript/issues/6149 or
      https://github.com/Microsoft/TypeScript/issues/7112 or
      https://github.com/Microsoft/TypeScript/pull/6196
    */
    switch (chartType) {
      case "labels-bar":
        return ["labels-bar", new Charts.DurationsOverTime(chartJSON)];
      case "labels-pie":
        return ["labels-pie", new Charts.PercentageRecent(chartJSON)];
      case "labels-stack":
        return ["labels-stack", new Charts.PercentageOverTime(chartJSON)];
      case "activity":
        return ["activity", new Charts.ActivityGrid(chartJSON)];
      case "top-guests":
        return ["top-guests", new Charts.TopGuests(chartJSON)];
      case "guest-domains":
        return ["guest-domains", new Charts.GuestDomains(chartJSON)];
      case "durations":
        return ["durations", new Charts.DurationHistogram(chartJSON)];
      case "availability":
        return ["availability", new Charts.WorkHoursGrid(chartJSON)];
      default:
        // Error!
        Log.e("Invalid chart type - " + chartType);

        // Return default
        return getChart(chartInfo[0].id, chartJSON);
    }
  }


  // /* Analytics */

  // var currentChart: Charts.Chart;
  // var currentTimer: number;

  // function trackView(chart: Charts.Chart) {
  //   // Cancel existing request
  //   if (currentTimer) { clearTimeout(currentTimer); }
  //   currentChart = chart;

  //   // Weed out incomplete views
  //   if (chart) {

  //     // Calculate start time relative to today
  //     var now = moment();
  //     var params = chart.params;
  //     var relStart = moment(params.windowStart).diff(now, 'days');
  //     var relEnd = moment(params.windowEnd).diff(now, 'days');

  //     // Set timeout to post Analytics tracking call after 3 seconds, but only
  //     // if we're still looking at the same view
  //     currentTimer = setTimeout(function() {
  //       if (_.isEqual(currentChart.params, chart.params)) {
  //         Analytics.track(Analytics.Trackable.ViewTimeStats, _.extend({
  //           labelCount: (params.selectedLabels || []).length,
  //           periodLength: relEnd - relStart
  //         }, chart.params));
  //       }
  //     }, 3000);
  //   }
  // }






}
