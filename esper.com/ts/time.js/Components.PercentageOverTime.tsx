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

  export class PercentageOverTime extends TimeStatsChart {
    render() {
      var formatted = TimeStats.formatWindowStarts(
        this.props.stats,
        this.props.request.interval);

      var labels = _.map(this.props.stats, (stat) =>
        TimeStats.exclusivePartitionByLabel(stat.partition,
                                            this.props.selectedLabels)
      );
      var results = TimeStats.getDisplayResultsBase(labels);
      results = _.sortBy(results, (x) => -x.totalDuration);
      var filtered = _.filter(results,
        (c) => _.contains(this.props.selectedLabels, c.labelNorm));
      var series = _.map(filtered, (c) => {
        return {
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          data: _.map(c.durations, (value) => TimeStats.toHours(value))
        }
      });
      return <div className="percentage-recent-chart">
        <Components.Highchart opts={{
          chart: {
            type: 'column'
          },

          plotOptions: {
            column: {
              stacking: 'percent',
              dataLabels: {
                enabled: true,
                formatter: function() {
                  return this.percentage ?
                    this.percentage.toFixed(2) + "%" : "";
                }
              }
            }
          },

          xAxis: {
            categories: formatted.groupLabels
          },

          yAxis: {
            title: { text: "Percentage" }
          },

          series: series
        }} units="Adjusted Hours" />
      </div>;
    }
  }
}
