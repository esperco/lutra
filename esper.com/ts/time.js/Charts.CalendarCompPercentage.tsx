/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Charts.CalendarComp.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {

  /*
    Stacked bar chart for comparing calendar events
  */
  export class CalendarCompPercentageChart extends CalendarCompChart {
    allowedIncrs() {
      return [-1, 1];
    }

    renderChart() {
      var categories = _.map(this.groupings,
        (d) => Text.fmtPeriod(d.period)
      );

      // One series for each period
      var series: {
        name: string,
        cursor: string,
        data: {
          name?: string,
          color: string,
          x: number,
          y: number,
          count: number,
          hours: number,
          events: HighchartsPointEvents
        }[]
      }[] = _.map(this.groupings, (d, x) => ({
        name: Text.fmtPeriod(d.period),
        cursor: "pointer",
        data: _(d.groups.some)
          .sortBy((s) => _.indexOf(this.sortedCalIds, s.key))
          .map((s) => {
            var calId = s.key;
            return {
              name: this.getCalendarName(calId),
              color: Colors.getColorForCal(calId),
              x: x,
              y: EventStats.toHours(
                _.sumBy(s.items, (i) => i.adjustedDuration)
              ),
              count: s.items.length,
              hours: EventStats.toHours(
                _.sumBy(s.items, (i) => i.duration)
              ),
              events: {
                click: () => this.onSeriesClick(_.map(s.items, (i) => i.event))
              }
            }
          })
          .value()
        })
      );

      return <div className="percentage-recent-chart">
        <Components.Highchart opts={{
          chart: {
            type: 'bar',
            height: categories.length * 100 + 120
          },

          legend: {
            enabled: false
          },

          plotOptions: {
            bar: {
              stacking: 'percent',
              borderWidth: 1
            }
          },

          xAxis: {
            categories: categories
          },

          yAxis: {
            title: { text: "Percentage" }
          },

          tooltip: countPointTooltip,

          series: series
        }} />
      </div>;
    }
  }
}
