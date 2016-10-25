/*
  Base class for a chart that shows absolute values as a bar chart -- takes
  the form of a stacked bar with each event equal to one stack segement
*/
module Esper.Components {
  export function BarChart({
    series, categories, simplified, orientation, yAxis
  } : {
    series: Charting.EventSeries[],
    categories: string[];
    simplified?: boolean;
    orientation?: 'vertical'|'horizontal'
    yAxis?: string;
  }) {
    orientation = orientation || 'horizontal';

    // Top 5 only for simplified bar chart
    series = simplified ? series.slice(0, 5) : series;

    return <Highchart showExport={!simplified} opts={{
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
