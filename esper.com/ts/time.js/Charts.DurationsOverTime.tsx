/*
  Bar chart for showing label durations over time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export class DurationsOverTime extends LabelChart {
    static displayName = "Label Duration Over Time";
    static usesIntervals = true;

    renderChart() {
      var formatted = TimeStats.formatWindowStarts(
        this.sync()[0].items,
        this.params.interval);

      var filtered = this.filterResults(this.getDisplayResults());
      var series = _.map(filtered, (c) => {
        return {
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          data: _.map(c.durations, (value) => TimeStats.toHours(value))
        }
      });

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
          categories: formatted.groupLabels
        },

        yAxis: {
          title: { text: "Time (Hours)" }
        },

        series: series
      }} units="Hours" />;
    }
  }
}
