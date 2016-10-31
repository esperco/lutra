/*
  Base class for pie chart
*/
module Esper.Components {
  export function PieChart({series, altExport, simplified, yAxis} : {
    series: Charting.SingleEventGroupSeries;
    altExport?: () => boolean;
    simplified?: boolean;
    yAxis?: string;
  }) {
    return <Highchart altExport={altExport} hideExport={simplified} opts={{
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
