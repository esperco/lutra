/*
  Base class for a chart that shows absolute values by different groups.
  Shows up as either a horizontal or verticl stacked bar chart depending
  on options.
*/
module Esper.Components {
  export function AbsoluteChart({series, categories, orientation, yAxis} : {
    series: Charting.EventSeries[],
    categories: string[];
    orientation?: 'vertical'|'horizontal'
    yAxis?: string;
  }) {
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
        categories: categories
      },

      yAxis: [{
        title: yAxis ? { text: yAxis } : null,
        stackLabels: {
          enabled: true,
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
