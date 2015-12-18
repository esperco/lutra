/*
  Bar chart for show label durations over time
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Components.TimeStatsChart.tsx" />
/// <reference path="./Components.Chart.tsx" />
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
      var totalDurationAll = _.sum(_.map(filtered, (f) => f.totalDuration));

      var formatted = TimeStats.formatWindowStarts(
        this.props.stats,
        this.props.request.interval);

      var data = _.map(filtered, (c) => {
        var baseColor = Colors.getColorForLabel(c.labelNorm);
        var percentage = (c.totalDuration / totalDurationAll) * 100;
        return {
          label: c.displayAs,
          color: baseColor,
          highlight: Colors.lighten(baseColor, 0.3),
          value: Number(percentage.toFixed(2))
        }
      });
      return <div className="percentage-recent-chart">
        <Components.DonutChart units="%" data={data}
         horizontalLabel={formatted.groupLabels[0]} />
      </div>;
    }
  }
}
