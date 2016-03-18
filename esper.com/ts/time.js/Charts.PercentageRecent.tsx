/*
  Pie chart for showing label percentages using split time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export class PercentageRecent extends LabelChart<Charts.LabelChartJSON> {
    renderChart() {
      // Filter to include only user-selected labels
      var results = this.getExclusiveDisplayResults();

      // Resort by duration (because pie)
      results = _.sortBy(results, (x) => -x.totalDuration);

      var labelCounts: {[index: string]: number} = {};
      var data = _.map(results, (c) => {
        labelCounts[c.labelNorm] = c.totalCount;
        return {
          id: c.labelNorm,
          name: c.displayAs,
          color: Colors.getColorForLabel(c.labelNorm),
          y: TimeStats.toHours(c.totalDuration)
        };
      });

      return <Components.Highchart opts={{
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
              }
            },
            size: '80%'
          }
        },

        tooltip: {
          formatter: function() {
            return `<b>${this.point.name}:</b> ${this.y} Adjusted Hours / ` +
              `${labelCounts[this.point.id]} Events` +
              (this.percentage ?
                ` (${Util.roundStr(this.percentage, 1)}%)`
                : "");
          }
        },

        series: [{
          data: data
        }]
      }} units="Adjusted Hours" />
    }
  }
}
