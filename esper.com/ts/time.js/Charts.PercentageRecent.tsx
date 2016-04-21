/*
  Pie chart for showing label percentages using split time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export class PercentageRecent extends LabelChart {
    totalDuration: number;
    totalCount: number;

    protected allowUnlabeled = true;
    protected durationsByLabel: EventStats.DurationsGrouping<{
      labels_norm: string[];
    }>;

    sync() {
      super.sync();

      var bounds = Period.boundsFromPeriod(this.params.period);
      var durations = EventStats.wrapWithDurations(this.events,
        (e) => Params.applyListSelectJSON(
          e.labels_norm,
          this.params.filterParams.labels
        ).flatMap((labels) => Option.some({
          event: e,
          labels_norm: labels
        })),
        { truncateStart: bounds[0], truncateEnd: bounds[1] }
      );

      this.totalDuration = _.sumBy(durations, (d) => d.adjustedDuration);
      this.totalCount = durations.length;
      this.durationsByLabel = Partition.groupByMany(durations,
        (e) => e.labels_norm
      );
      this.durationsByLabel.some = _.sortBy(this.durationsByLabel.some,
        (s) => 0 - _.sumBy(s.items,
          (i) => i.adjustedDuration / i.labels_norm.length
        )
      );
    }

    onSeriesClick(events: Events2.TeamEvent[]) {
      Layout.renderModal(Containers.eventListModal(events));
      return false;
    }

    getTotals() {
      return [{
        period: this.params.period,
        duration: this.totalDuration,
        count: this.totalCount
      }];
    }

    renderChart() {
      var data = _.map(this.durationsByLabel.some, (d) => ({
        name: Labels.getDisplayAs(d.key),
        color: Colors.getColorForLabel(d.key),
        count: d.items.length,
        // hours: EventStats.toHours(_.sumBy(d.items, (i) => i.duration)),
        y: EventStats.toHours(
          _.sumBy(d.items, (i) => i.adjustedDuration / i.labels_norm.length)
        ),
        events: {
          click: () => this.onSeriesClick(_.map(d.items, (i) => i.event))
        }
      }));

      if (this.showUnlabeled() && this.durationsByLabel.none.length) {
        data.push({
          name: "Unlabeled Events",
          color: Colors.lightGray,
          count: this.durationsByLabel.none.length,
          // hours: EventStats.toHours(
          //   _.sumBy(this.durationsByLabel.none, (i) => i.duration)
          // ),
          y: EventStats.toHours(
            _.sumBy(this.durationsByLabel.none,
              (i) => i.adjustedDuration
            )
          ),
          events: {
            click: () => this.onSeriesClick(
              _.map(this.durationsByLabel.none, (i) => i.event)
            )
          }
        })
      }

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

        tooltip: countPointTooltip,

        series: [{
          data: data
        }]
      }} />;
    }
  }
}
