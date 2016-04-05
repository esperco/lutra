/*
  Pie chart for showing label percentages using split time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  export class PercentageRecent extends LabelChart {
    protected allowUnlabeled = true;
    protected durationsByLabel: EventStats.DurationsGrouping<{
      labels_norm: string[];
    }>;

    sync() {
      super.sync();

      var bounds = Period.boundsFromPeriod(this.params.period);
      var durations = EventStats.wrapWithDurations(this.events,
        (e) => Actions.applyListSelectJSON(
          e.labels_norm,
          this.params.filterParams.labels
        ).flatMap((labels) => labels.length > 1 ?
          Option.some([Labels.MULTI_LABEL_ID]) :
          Option.some(labels)
        ).flatMap((labels) => Option.some({
          event: e,
          labels_norm: labels
        })),
        { truncateStart: bounds[0], truncateEnd: bounds[1] }
      );

      this.durationsByLabel = Partition.groupByMany(durations,
        (e) => e.labels_norm
      );
      this.durationsByLabel.some = _.sortBy(this.durationsByLabel.some,
        (s) => {
          if (s.key === Labels.MULTI_LABEL_ID) {
            return Infinity;
          }
          return 0 - _.sumBy(s.items, (i) => i.adjustedDuration);
        }
      );
    }

    onSeriesClick(events: Events2.TeamEvent[]) {
      Layout.renderModal(Containers.eventListModal(events));
      return false;
    }

    renderChart() {
      var data = _.map(this.durationsByLabel.some, (d) => ({
        name: Labels.getDisplayAs(d.key),
        color: Colors.getColorForLabel(d.key),
        count: d.items.length,
        hours: TimeStats.toHours(_.sumBy(d.items, (i) => i.duration)),
        y: TimeStats.toHours(
          _.sumBy(d.items, (i) => i.adjustedDuration)
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
          hours: TimeStats.toHours(
            _.sumBy(this.durationsByLabel.none, (i) => i.duration)
          ),
          y: TimeStats.toHours(
            _.sumBy(this.durationsByLabel.none, (i) => i.adjustedDuration)
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
      }} />
    }
  }
}
