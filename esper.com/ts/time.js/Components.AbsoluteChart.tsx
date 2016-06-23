/*
  Base class for a chart that shows absolute values by different groups.
  Shows up as either a horizontal or verticl stacked bar chart depending
  on options.
*/
module Esper.Components {
  export function AbsoluteChart({series, orientation, yAxis} : {
    series: Charting.EventSeries[],
    orientation?: 'vertical'|'horizontal'
    yAxis?: string;
  }) {
    series = _.sortBy(series, (s) => s.index);
    orientation = orientation || 'horizontal';

    return <Components.Highchart opts={{
      chart: {
        type: orientation === 'vertical' ? 'column' : 'bar'
      },

      tooltip: Charting.eventPointTooltip,

      legend: {
        enabled: false
      },

      plotOptions: {
        column: {
          stacking: 'normal'
        }
      },

      xAxis: {
        categories: _.map(EventStats.DurationBucketCalc.BUCKETS,
          (b) => b.label
        )
      },

      yAxis: yAxis ? [{
        title: { text: yAxis }
      }] : null,

      series: series
    }} />;
  }
}
