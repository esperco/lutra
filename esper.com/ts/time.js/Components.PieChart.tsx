/*
  Base class for pie chart
*/
module Esper.Components {
  export function PieChart({series, simplified, yAxis} : {
    series: Charting.SingleEventGroupSeries;
    simplified?: boolean;
    yAxis?: string;
  }) {
    return <Highchart showExport={!simplified} opts={{
      chart: {
        type: 'pie'
      },

      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            formatter: function() {
              if (this.percentage) {
                if (simplified && this.percentage < 5) {
                  return "";
                }
                return `${this.point.name} ` +
                  `(${Util.roundStr(this.percentage, 1)}%)`;
              }
              return "";
            }
          },
          size: simplified ? '90%' : '80%'
        }
      },

      legend: {
        enabled: false
      },

      xAxis: {},

      yAxis: {
        title: { text: yAxis || Text.ChartPercentage }
      },

      tooltip: Charting.countPointTooltip,

      series: [series]
    }} />;
  }
}
