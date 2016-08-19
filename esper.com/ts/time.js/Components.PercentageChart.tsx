/*
  Base class for a chart that shows percentages for different groups.
  Shows up as pie chart if only one series (time period) -- else shows
  horizontal stacked bar charts
*/
module Esper.Components {
  export function PercentageChart({series, simplified, yAxis} : {
    series: Charting.EventGroupSeries[];
    simplified?: boolean;
    yAxis?: string;
  }) {
    series = _.sortBy(series, (s) => s.index);
    return <Components.Highchart showExport={!simplified} opts={{
      chart: series.length > 1 ? {
        type: 'bar',
        height: series.length * 100 + 120
      } : {
        type: 'pie'
      },

      plotOptions: {
        bar: {
          stacking: 'percent',
          borderWidth: 1
        },

        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: !simplified,
            formatter: function() {
              if (this.percentage) {
                return `${this.point.name} ` +
                  `(${Util.roundStr(this.percentage, 1)}%)`;
              }
            }
          },
          size: simplified ? '100%' : '80%'
        }
      },

      legend: {
        enabled: false
      },

      xAxis: series.length > 1 ? {
        categories: _.map(series, (s) => s.name)
      } : {},

      yAxis: {
        title: { text: yAxis || Text.ChartPercentage }
      },

      tooltip: Charting.countPointTooltip,

      series: series
    }} />;
  }
}
