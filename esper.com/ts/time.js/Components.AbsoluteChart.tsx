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
      chart: orientation === 'vertical' ? {
        type: 'column'
      } : {
        type: 'bar',
        height: series.length * 50 + 120
      },

      tooltip: Charting.eventPointTooltip,

      legend: {
        enabled: false
      },

      plotOptions: {
        column: {
          stacking: 'normal'
        },

        bar: {
          borderWidth: 1,
          stacking: 'normal'
        }
      },

      xAxis: {
        categories: _.map(series, (s) => s.name)
      },

      yAxis: yAxis ? [{
        title: { text: yAxis }
      }] : null,

      series: series
    }} />;
  }
}
