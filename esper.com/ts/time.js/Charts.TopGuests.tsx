/*
  Pie chart for showing guests by domain
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.GuestChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class TopGuests extends GuestChart {
    static displayName = "Top Guests";
    static usesIntervals = false;

    renderChart() {
      var data = this.sync()[0];
      var domains = this.getSelectedDomains();
      var guests = DailyStats.topGuests(data, false, this.getSelectedDomains());
      var guestNames = _.map(guests,
        (g) => g.name ? `${g.name} (${g.email})` : g.email
      );
      var guestTimes = _.map(guests, (g) => ({
        color: Colors.getColorForDomain(g.email.split('@')[1]),
        y: TimeStats.toHours(g.time)
      }));
      var guestCounts = _.flatten(
        _.map(guests, (g, i) => _.times(g.count, () => ({
          x: i, y: 1,
          color: Colors.lighten(
            Colors.getColorForDomain(g.email.split('@')[1]), 0.5)
        }))));

      return <Components.Highchart opts={{
        chart: {
          type: 'bar',
          height: guestTimes.length * 50 + 120
        },

        legend: {
          enabled: false
        },

        plotOptions: {
          bar: {
            borderWidth: 1,
            stacking: 'normal'
          }
        },

        tooltip: {
          shared: true,
          formatter: function() {
            var events = this.points[0].total;
            var hours = this.points[1].y;
            return `${hours} hour${hours != 1 ? 's' : ''} / ` +
                  `${events} event${events != 1 ? 's' : ''}`;
          }
        },

        xAxis: {
          categories: guestNames
        },

        yAxis: [{
          title: { text: "Number of Events" },
          allowDecimals: false,
          visible: false
        }, {
          title: { text: "Duration (Hours)" },
        }],

        series: [{
          name: "Number of Events",
          yAxis: 0,
          stack: 0,
          color: Colors.second,
          data: guestCounts
        } as HighchartsBarChartSeriesOptions, {
          name: "Duration (Hours)",
          yAxis: 1,
          stack: 1,
          color: Colors.first,
          data: guestTimes
        } as HighchartsBarChartSeriesOptions]
      }} />;
    }
  }
}
