/*
  Bar chart for show label durations over time
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.TimeStatsChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class PercentageRecent extends TimeStatsChart {
    render() {
      var labels = _.map(this.props.stats, (stat) =>
        TimeStats.exclusivePartitionByLabel(stat.partition,
                                            this.props.selectedLabels)
      );
      var results = TimeStats.getDisplayResultsBase(labels);
      results = _.sortBy(results, (x) => -x.totalDuration);
      var filtered = _.filter(results,
        (c) => _.contains(this.props.selectedLabels, c.labelNorm));
      var data = _.map(filtered, (c) => {
        return {
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          y: TimeStats.toHours(c.totalDuration)
        }
      });
      return <div className="percentage-recent-chart">
        <Components.Highchart opts={{
          chart: {
            type: 'pie'
          },

          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                formatter: function() {
                  if (this.percentage) {
                    return `${this.point.name} ` +
                      `(${this.percentage.toFixed(2)}%)`;
                  }
                }
              }
            }
          },

          series: [{
            data: data
          }]
        }} units="Adjusted Hours" />
      </div>;
    }
  }
}
