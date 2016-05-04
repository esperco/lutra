/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="./Charts.CalendarComp.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  /*
    Pie chart for comparing calendar events
  */
  export class CalendarCompPieChart extends CalendarCompChart {
    renderChart() {
      // Should only be one grouping
      var data = this.groupings[0];
      if (! data) { return this.noDataMsg(); }

      var seriesData = _.map(data.groups.some, (d) => ({
        name: this.getCalendarName(d.key),
        color: Colors.getColorForCal(d.key),
        count: d.items.length,
        // hours: EventStats.toHours(_.sumBy(d.items, (i) => i.duration)),
        y: EventStats.toHours(
          _.sumBy(d.items, (i) => i.adjustedDuration)
        ),
        events: {
          click: () => this.onSeriesClick(_.map(d.items, (i) => i.event))
        }
      }));

      return <Components.Highchart opts={{
        chart: {
          type: 'pie'
        },

        plotOptions: {
          pie: {
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

        tooltip: countPointTooltip,

        series: [{
          data: seriesData
        }]
      }} />;
    }
  }
}
