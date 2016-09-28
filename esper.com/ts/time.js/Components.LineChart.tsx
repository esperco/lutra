/*
  Base class for a chart that shows percentage values as a bar chart -- takes
  the form of a stacked bar with each event equal to one stack segement
*/
module Esper.Components {
  export function LineChart({
    series, categories, simplified, yAxis
  } : {
    series: Charting.EventGroupSeries[],
    categories: string[];
    simplified?: boolean;
    yAxis?: string;
  }) {
    return <Highchart showExport={!simplified} opts={{
      chart: {
        type: 'line'
      },

      tooltip: Charting.countPointTooltip,

      legend: {
        enabled: false
      },

      plotOptions: {
        line: {},
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
