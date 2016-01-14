/*
  Bar chart for show label durations over time
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Components.TimeStatsChart.tsx" />
/// <reference path="./Components.Chart.tsx" />
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

      var datasets = _.map(filtered, (c) => {
        var baseColor = Colors.getColorForLabel(c.labelNorm);
        return {
          label: c.displayAs,
          fillColor: baseColor,
          strokeColor: Colors.darken(baseColor, 0.3),
          highlightFill: Colors.lighten(baseColor, 0.3),
          highlightStroke: baseColor,
          data: _.map(c.durations, (value) => TimeStats.toHours(value))
        }
      });
      var data = {
        labels: columnLabels,
        datasets: datasets
      };

      return <Components.BarChart units="Hours"
              verticalLabel="Time (Hours)"
              horizontalLabel={horizontalLabel}
              data={data} />;
    }
  }
}
