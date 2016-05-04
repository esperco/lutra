/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../lib/Analytics.Web.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <refernece path="./Actions" />
/// <reference path="./Charts.tsx" />
/// <reference path="./Views.Charts.tsx" />

module Esper.Actions {

  type ChartVariant =
    ["activity", Charts.EventGrid]|
    ["cal-comp-hours", Charts.CalendarCompHoursChart]|
    ["cal-comp-percent", Charts.CalendarCompPercentageChart]|
    ["cal-comp-pie", Charts.CalendarCompPieChart]|
    ["durations", Charts.DurationHistogram]|
    ["guest-domains", Charts.GuestDomains]|
    ["labels-bar", Charts.TopLabels]|
    ["labels-pie", Charts.PercentageRecent]|
    ["labels-stack", Charts.PercentageOverTime]|
    ["top-guests", Charts.TopGuests];

  /*
    Make sure this matches first part of chart variant above. Not sure if
    there's a good way to have TypeScript check this automatically.
  */
  export type ChartId =
    "activity"|
    "cal-comp-hours"|
    "cal-comp-percent"|
    "cal-comp-pie"|
    "durations"|
    "guest-domains"|
    "labels-bar"|
    "labels-pie"|
    "labels-stack"|
    "top-guests";

  /* Display Info */

  export interface ChartTypeInfo {
    id: ChartId;
    displayAs: string;
    icon?: string;
  }

  var chartInfo: ChartTypeInfo[] = [{
    id: "activity",
    icon: "fa-th",
    displayAs: "Monthly Overview"
  }, {
    id: "cal-comp-hours",
    icon: "fa-calendar-o",
    displayAs: "Calendar Hours"
  },{
    id: "cal-comp-percent",
    icon: "fa-calendar-o",
    displayAs: "Calendar Percentages"
  }, {
    id: "cal-comp-pie",
    icon: "fa-calendar-o",
    displayAs: "Calendar Pie Chart"
  }, {
    id: "durations",
    icon: "fa-clock-o",
    displayAs: "Event Durations"
  }, {
    id: "guest-domains",
    icon: "fa-globe",
    displayAs: "Guest Groups Pie Chart"
  }, {
    id: "labels-bar",
    icon: "fa-tags",
    displayAs: "Label Hours"
  }, {
    id: "labels-stack",
    icon: "fa-tags",
    displayAs: "Label Percentages"
  }, {
    id: "labels-pie",
    icon: "fa-tags",
    displayAs: "Label Pie Chart"
  }, {
    id: "top-guests",
    icon: "fa-users",
    displayAs: "Top Guests"
  }];
  chartInfo = _.sortBy(chartInfo, (c) => c.displayAs);


  /* Analytics */

  var analyticsId = "chart-analytics-id";

  function trackChart(variant: ChartVariant) {
    var params = variant[1].params;

    // Delay tracking by 2 seconds to ensure user is actually looking at chart
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.TimeStatsCharts, {
        chartType: variant[0],
        params: variant[1].params,
        interval: params.period.interval
      });
    }, 2000);
  }

  ///////

  export function renderChart(params: Charts.DefaultEventChartParams) {
    // This isn't cleaned in routing
    params = _.clone(params);
    params.chartId = params.chartId || getDefaultChartType();

    var chartVariant = getChart(params);
    var chartId = chartVariant[0];
    var chart = chartVariant[1];
    chart.async();

    render(<Views.Charts
      currentChart={chart}
      chartTypes={chartInfo}
    />);

    trackChart(chartVariant);
  }

  function getDefaultChartType(): ChartId {
    return "labels-pie";
  }

  function getChart(params: Charts.DefaultEventChartParams): ChartVariant {
    /*
      Type-checks on ChartId aren't working, so be careful with strings.

      Pending resolution of
      https://github.com/Microsoft/TypeScript/issues/6149 or
      https://github.com/Microsoft/TypeScript/issues/7112 or
      https://github.com/Microsoft/TypeScript/pull/6196
    */
    switch (params.chartId) {
      case "labels-bar":
        return ["labels-bar", new Charts.TopLabels(params)];
      case "labels-pie":
        return ["labels-pie", new Charts.PercentageRecent(params)];
      case "labels-stack":
        return ["labels-stack", new Charts.PercentageOverTime(params)];
      case "top-guests":
        return ["top-guests", new Charts.TopGuests(params)];
      case "guest-domains":
        return ["guest-domains", new Charts.GuestDomains(params)];
      case "durations":
        return ["durations", new Charts.DurationHistogram(params)];
      case "cal-comp-pie":
        return ["cal-comp-pie", new Charts.CalendarCompPieChart(params)];
      case "cal-comp-percent":
        return ["cal-comp-percent",
                new Charts.CalendarCompPercentageChart(params)];
      case "cal-comp-hours":
        return ["cal-comp-hours", new Charts.CalendarCompHoursChart(params)];
      case "activity":
        return ["activity", new Charts.EventGrid(params)];
      default:
        // Error!
        Log.e("Invalid chart type - " + params.chartId);
        params = _.clone(params);
        params.chartId = chartInfo[0].id;
        return getChart(params);
    }
  }
}
