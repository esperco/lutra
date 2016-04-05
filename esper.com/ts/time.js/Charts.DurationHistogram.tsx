/*
  Bar chart for showing label durations over time
*/

/// <reference path="./Charts.tsx" />
/// <reference path="./Components.Highchart.tsx" />

module Esper.Charts {
  // Durations for each bar in our histogram
  const DURATION_BUCKETS = [{
    label: "< 30m",
    gte: 0   // Greater than, seconds
  }, {
    label: "30m +",
    gte: 30 * 60
  }, {
    label: "1h +",
    gte: 60 * 60
  }, {
    label: "2h +",
    gte: 2 * 60 * 60
  }, {
    label: "4h +",
    gte: 4 * 60 * 60
  }, {
    label: "8h +",
    gte: 8 * 60 * 60
  }];

  export class DurationHistogram extends EventChart<{}> {
    protected periodsByBucket: Array<GroupsByPeriod<{
      bucketIndex: number; // Which bucket does this go into
    }>>;

    periodIncrs() {
      return [-1, 0, 1];
    }

    sync() {
      super.sync();

      this.periodsByBucket = this.getGroupsByPeriod(
        (e: Events2.TeamEvent) => {
          var duration = moment(e.end).diff(moment(e.start), 'seconds');
          return Option.some({
            event: e,
            bucketIndex: _.findLastIndex(DURATION_BUCKETS,
              (b) => duration >= b.gte
            )
          });
        },

        (y) => [y.bucketIndex.toString()]
      );
    }

    onEventClick(event: Events2.TeamEvent) {
      Layout.renderModal(Containers.eventEditorModal([event]));
      return false;
    }

    renderChart() {
      var series: {
        name: string,
        cursor: string,
        color: string,
        stack: number,
        index: number,
        data: HighchartsDataPoint[]
      }[] = []

      _.each(this.periodsByBucket, (p) => {
        _.each(p.groups.some, (s) => {
          var key = parseInt(s.key);
          var bucket = DURATION_BUCKETS[key];
          series.push({
            name:  bucket.label,
            cursor: "pointer",
            color: _.isEqual(p.period, this.params.period) ?
              Colors.presets[key] : Colors.lightGray,
            stack: p.period.index,
            index: p.period.index,
            data: _.map(s.items, (w) => ({
              name: Text.eventTitleForChart(w.event),
              x: key,
              y: EventStats.toHours(w.duration),
              events: {
                click: () => this.onEventClick(w.event)
              }
            }))
          });
        })
      });

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        tooltip: eventPointTooltip,

        legend: {
          enabled: false
        },

        plotOptions: {
          column: {
            stacking: 'normal'
          }
        },

        xAxis: {
          categories: _.map(DURATION_BUCKETS, (b) => b.label)
        },

        yAxis: [{
          title: { text: "Duration (Hours)" }
        }],

        series: series
      }} />;
    }
  }
}
