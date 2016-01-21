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

  export class DurationsOverTime extends TimeStatsChart {
    render() {
      var formatted = TimeStats.formatWindowStarts(
        this.props.stats,
        this.props.request.interval);
      var horizontalLabel = formatted.typeLabel;
      var columnLabels = formatted.groupLabels;

      var durationOverTimeData = this.props.displayResults ||
        TimeStats.getDisplayResults(this.props.stats);
      var filtered = _.filter(durationOverTimeData,
        (c) => _.contains(this.props.selectedLabels, c.labelNorm));

      var series = _.map(filtered, (c) => {
        return {
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          data: _.map(c.durations, (value) => TimeStats.toHours(value))
        }
      });

      // No data
      if (!series || !series.length) {
        return this.renderNoData();
      }

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        xAxis: {
          categories: columnLabels
        },

        yAxis: {
          title: { text: "Time (Hours)" }
        },

        series: series
      }} units="Hours" />;
    }
  }
}
