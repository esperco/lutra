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
    gte: 0   // Greater than, seconds
  }, {
    label: "30m +",
    gte: 30 * 60
  }, {
    label: "1h +",
    gte: 60 * 60
  }, {
    label: "2h +",
    gte: 2 * 60 * 60
  }, {
    label: "4h +",
    gte: 4 * 60 * 60
  }, {
    label: "8h +",
    gte: 8 * 60 * 60
  }];

  export class DurationHistogram extends AutoChart {
    static displayName = "Event Durations";

    renderChart() {
      var data = this.sync()[0];
      var series: {
        name: string,
        color: string,
        data: {name?: string, x: number, y: number}[]
      }[] = _.map(DURATION_BUCKETS, (b, i) => ({
        name: b.label,
        color: Colors.presets[i],
        data: []
      }))

      _.each(data.daily_stats, function(stat) {
        _.each(stat.scheduled, function(duration) {
          var i = _.findLastIndex(DURATION_BUCKETS, (b) => {
            return duration >= b.gte;
          });
          series[i].data.push({
            name: "Event on " + moment(stat.window_start).format("MMM D"),
            x: i,
            y: TimeStats.toHours(duration)
          })
        });
      });

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        tooltip: {
          formatter: function() {
            if (this.point.name) {
              return `<b>${this.point.name}:</b>` +
                     `${this.y} hour${this.y != 1 ? 's' : ''}`;
            } else {
              return `${this.y} hours`;
            }
          }
        },

        legend: {
          enabled: false
        },

        plotOptions: {
          column: {
            stacking: 'normal'
          }
        },

        xAxis: {
          categories: _.map(DURATION_BUCKETS, (b) => b.label)
        },

        yAxis: [{
          title: { text: "Duration (Hours)" }
        }],

        series: series
      }} />;
    }
  }
}
