/*
  Base class for a chart that shows percentage values as a bar chart -- takes
  the form of a stacked bar with each event equal to one stack segement
*/
module Esper.Components {
  export function StackedBarChart({
    series, categories, simplified, orientation, yAxis
  } : {
    series: Charting.EventGroupSeries[],
    categories: string[],
    simplified?: boolean;
    orientation?: 'vertical'|'horizontal'
    yAxis?: string;
  }) {
    orientation = orientation || 'vertical';

    return <Highchart showExport={!simplified} opts={{
      chart: orientation === 'vertical' ? {
        type: 'column'
      } : {
        type: 'bar',
        height: simplified ? series.length * 50 : series.length * 50 + 120
      },

      tooltip: Charting.countPointTooltip,

      legend: {
        enabled: false
      },

      plotOptions: {
        column: {
          borderWidth: 1,
          stacking: 'percent'
        },

        bar: {
          borderWidth: 1,
          stacking: 'percent'
        }
      },

      xAxis: {
        categories: categories
      },

      yAxis: [{
        title: yAxis && !simplified ? { text: yAxis } : null,
        visible: !simplified,
      }],

      series: series
    }} />;
  }
}
