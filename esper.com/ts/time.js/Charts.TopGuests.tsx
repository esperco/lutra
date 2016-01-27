/*
  Pie chart for showing guests by domain
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class TopGuests extends AutoChart {
    static displayName = "Frequent Meeting Attendees";
    static usesIntervals = false;

    renderChart() {
      var data = this.sync()[0];
      var guests = DailyStats.topGuests(data);
      var guestNames = _.map(guests,
        (g) => g.name ? `${g.name} (${g.email})` : g.email
      );
      var guestTimes = _.map(guests, (g) => TimeStats.toHours(g.time));
      var guestCounts = _.map(guests, (g) => g.count);

      return <Components.Highchart opts={{
        chart: {
          type: 'bar',
          height: guestTimes.length * 50 + 120
        },

        plotOptions: {
          bar: {
            borderWidth: 0
          }
        },

        xAxis: {
          categories: guestNames
        },

        yAxis: [{
          title: { text: "Aggregate Duration (Hours)" }
        }, {
          title: { text: "Number of Events" },
          allowDecimals: false,
          opposite: true
        }],

        series: [{
          name: "Aggregate Duration (Hours)",
          yAxis: 0,
          color: Colors.first,
          data: guestTimes
        } as HighchartsBarChartSeriesOptions, {
          name: "Number of Events",
          yAxis: 1,
          color: Colors.second,
          data: guestCounts
        } as HighchartsBarChartSeriesOptions]
      }} />;
    }
  }
}
