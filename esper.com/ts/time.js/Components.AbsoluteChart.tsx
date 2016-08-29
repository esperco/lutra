/*
  Base class for a chart that shows absolute values by different groups.
  Shows up as either a horizontal or verticl stacked bar chart depending
  on options.
*/
module Esper.Components {
  export function AbsoluteChart({
    series, categories, simplified, orientation, yAxis
  } : {
    series: Charting.EventSeries[],
    categories: string[];
    simplified?: boolean;
    orientation?: 'vertical'|'horizontal'
    yAxis?: string;
  }) {
    orientation = orientation || 'horizontal';

    return <Components.Highchart showExport={!simplified} opts={{
      chart: orientation === 'vertical' ? {
        type: 'column'
      } : {
        type: 'bar',
        height: simplified ? series.length * 50 : series.length * 50 + 120
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
        categories: categories
      },

      yAxis: [{
        title: yAxis && !simplified ? { text: yAxis } : null,
        visible: !simplified,
        stackLabels: {
          enabled: !simplified,
          formatter: Charting.stackPointFormatter,
          style: {
            fontSize: "10px",
            fontWeight: "normal",
            textShadow: "none"
          }
        }
      }],

      series: series
    }} />;
  }
}
