/*
  Bar chart for showing label durations over time
*/

/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  // Durations for each bar in our histogram
  const DURATION_BUCKETS = [{
    label: "< 30m",
    gt: 0   // Greater than, seconds
  }, {
    label: "30m +",
    gt: 30 * 60
  }, {
    label: "1h +",
    gt: 60 * 60
  }, {
    label: "2h +",
    gt: 2 * 60 * 60
  }, {
    label: "4h +",
    gt: 4 * 60 * 60
  }, {
    label: "8h +",
    gt: 8 * 60 * 60
  }];

  export class DurationHistogram extends AutoChart {
    static displayName = "Event Durations";

    renderChart() {
      var data = this.sync()[0];
      var aggDuration = _.map(DURATION_BUCKETS, () => 0);
      var frequency = _.clone(aggDuration);

      _.each(data.daily_stats, function(stat) {
        _.each(stat.scheduled, function(duration) {
          var i = _.findLastIndex(DURATION_BUCKETS, (b) => {
            return duration > b.gt;
          });
          aggDuration[i] += duration;
          frequency[i] += 1;
        });
      });

      // Round to hour
      aggDuration = _.map(aggDuration, (a) => TimeStats.toHours(a));

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        plotOptions: {
          column: {
            borderWidth: 0
          }
        },

        xAxis: {
          categories: _.map(DURATION_BUCKETS, (b) => b.label)
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
          data: aggDuration
        } as HighchartsColumnChartSeriesOptions, {
          name: "Number of Events",
          yAxis: 1,
          color: Colors.second,
          data: frequency
        } as HighchartsColumnChartSeriesOptions]
      }} />;
    }
  }
}
