/*
  Bar chart for showing label percentages over time using split time
*/

module Esper.Charts {
  type LabelsGrouping = GroupsByPeriod<{
    labels_norm: string[];
  }>[];

  export class PercentageOverTime extends LabelChart {
    protected durationsByLabel: LabelsGrouping;
    protected sortedLabels: string[];
    protected allowUnlabeled = true;

    allowedIncrs() {
      return [-1, 1];
    }

    sync() {
      super.sync();
      this.durationsByLabel = this.getGroupsByPeriod(

        // Filter + wrapping function
        (e) => Params.applyListSelectJSON(
          Stores.Events.getLabelIds(e),
          this.params.filterParams.labels
        ).flatMap((labels) => Option.some({
          event: e,
          labels_norm: labels
        })),

        // Group by labels
        (w) => w.labels_norm
      );

      this.sortedLabels = this.sortByForCurrentPeriod(
        this.durationsByLabel, (w) => -w.adjustedDuration
      );
    }

    onPointClick(events: Stores.Events.TeamEvent[]) {
      Layout.renderModal(Containers.eventListModal(events));
      return false;
    }

    getTotals() {
      return _.map(this.durationsByLabel, (d) => ({
        period: d.period,
        duration: d.totalAdjusted,
        count: d.totalCount
      }));
    }

    renderChart() {
      var durations = _.sortBy(this.durationsByLabel,
        (d) => Period.asNumber(d.period)
      );
      var categories = _.map(durations, (d) => Text.fmtPeriod(d.period));

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
          // hours: number,
          events: HighchartsPointEvents
        }[]
      }[] = _.map(durations, (d, x) => ({
        name: Text.fmtPeriod(d.period),
        cursor: "pointer",
        data: _(d.groups.some)
          .sortBy((s) => _.indexOf(this.sortedLabels, s.key))
          .map((s) => {
            var label = s.key;
            return {
              name: Labels.getDisplayAs(label),
              color: Colors.getColorForLabel(label),
              x: x,
              y: EventStats.toHours(
                _.sumBy(s.items,
                  (i) => i.adjustedDuration / i.labels_norm.length
                )
              ),
              count: s.items.length,
              // hours: EventStats.toHours(
              //   _.sumBy(s.items, (i) => i.duration)
              // ),
              events: {
                click: () => this.onPointClick(_.map(s.items, (i) => i.event))
              }
            }
          })
          .value()
        })
      );

      if (this.showUnlabeled()) {
        _.each(durations, (d, x) =>
          series[x].data.push({
            name: Text.Unlabeled,
            color: Colors.lightGray,
            x: x,
            y: EventStats.toHours(
              _.sumBy(d.groups.none, (i) => i.adjustedDuration)
            ),
            count: d.groups.none.length,
            // hours: EventStats.toHours(
            //   _.sumBy(d.groups.none, (i) => i.duration)
            // ),
            events: {
              click: () => this.onPointClick(
                _.map(d.groups.none, (w) => w.event)
              )
            }
          })
        );
      }

      return <Components.Highchart opts={{
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
      }} />;
    }
  }
}
