/*
  Bar chart for showing label percentages over time using split time
*/

/// <reference path="./Charts.DurationsOverTime.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export class PercentageOverTime extends DurationsOverTime {
    renderChart() {
      var formatted = TimeStats.formatWindowStarts(
        this.sync()[0].items,
        this.params.chartParams.interval);

      // Filter to include only user-selected labels
      var results = this.getExclusiveDisplayResults();

      // Actual HighCharts data
      var series = _.map(results, (c) => {
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
              borderWidth: 1
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
