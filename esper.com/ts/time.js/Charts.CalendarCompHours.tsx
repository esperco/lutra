/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="./Charts.CalendarComp.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {

  /*
    Stacked bar chart for comparing calendar events
  */
  export class CalendarCompHoursChart extends CalendarCompChart {
    allowedIncrs() {
      return [-1, 1];
    }

    onEventClick(event: Events2.TeamEvent) {
      Layout.renderModal(Containers.eventEditorModal([event]));
      return false;
    }

    renderChart() {
      var categories = _.map(this.sortedCalIds,
        (calId) => this.getCalendarName(calId)
      );
      var series: {
        name: string,
        cursor: string,
        color: string,
        stack: string,
        index: number,
        data: HighchartsDataPoint[]
      }[] = [];

      _.each(this.groupings, (g) =>
        _.each(g.groups.some, (s) => {
          let calId = s.key;
          var color = _.isEqual(g.period, this.params.period) ?
            Colors.getColorForCal(calId) : Colors.lightGray;
          series.push({
            name: this.getCalendarName(calId),
            cursor: "pointer",
            color: color,
            stack: Text.fmtPeriod(g.period),
            index: Period.asNumber(g.period),
            data: _.map(s.items, (wrapper) => ({
              name: Text.eventTitleForChart(wrapper.event),
              x: _.indexOf(this.sortedCalIds, calId),
              y: EventStats.toHours(wrapper.adjustedDuration),
              events: {
                click: () => this.onEventClick(wrapper.event)
              }
            }) as HighchartsDataPoint)
          })
        })
      );

      return <Components.Highchart opts={{
        chart: {
          type: 'bar',
          height: categories.length * 50 + 120
        },

        tooltip: eventPointTooltip,

        legend: {
          enabled: false
        },

        plotOptions: {
          bar: {
            borderWidth: 1,
            stacking: 'normal'
          }
        },

        xAxis: {
          categories: categories
        },

        yAxis: [{
          title: { text: "Duration (Hours)" }
        }],

        series: series
      }} />;
    }
  }
}
