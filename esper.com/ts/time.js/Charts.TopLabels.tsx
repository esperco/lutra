/*
  Pie chart for showing label percentages using split time
*/

/// <reference path="./Charts.LabelChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  type LabelsGrouping = GroupsByPeriod<{
    labels_norm: string[];
  }>[];

  export class TopLabels extends LabelChart {
    protected durationsByLabel: LabelsGrouping;
    protected sortedLabels: string[];

    periodIncrs() {
      return [-1, 0, 1];
    }

    sync() {
      super.sync();
      this.durationsByLabel = this.getGroupsByPeriod(

        // Filter + wrapping function
        (e) => Actions.applyListSelectJSON(
          e.labels_norm,
          this.params.filterParams.labels
        ).flatMap((labels) => Option.some({
          event: e,
          labels_norm: labels
        })),

        // Group by labels
        (w) => w.labels_norm
      );
      this.sortedLabels = this.sortByForCurrentPeriod(
        this.durationsByLabel, (w) => -w.duration
      );
    }

    onEventClick(event: Events2.TeamEvent) {
      Layout.renderModal(Containers.eventEditorModal([event]));
      return false;
    }

    renderChart() {
      var categories = this.sortedLabels;
      var durations = this.durationsByLabel;
      var series: {
        name: string,
        cursor: string,
        color: string,
        stack: string,
        index: number,
        data: HighchartsDataPoint[]
      }[] = [];

      _.each(durations, (d) =>
        _.each(d.groups.some, (s) => {
          let label = s.key;
          var color = _.isEqual(d.period, this.params.period) ?
            Colors.getColorForLabel(label) : Colors.lightGray;
          series.push({
            name: Labels.getDisplayAs(label),
            cursor: "pointer",
            color: color,
            stack: Text.fmtPeriod(d.period),
            index: d.period.index,
            data: _.map(s.items, (wrapper) => ({
              name: Text.eventTitleForChart(wrapper.event),
              x: _.indexOf(categories, label),
              y: EventStats.toHours(wrapper.duration),
              events: {
                click: () => this.onEventClick(wrapper.event)
              }
            } as HighchartsDataPoint))
          })
        })
      );

      if (this.showUnlabeled()) {
        _.each(this.durationsByLabel, (d) =>
          series.push({
            name: "Unlabeled Events",
            cursor: "pointer",
            color: (
              _.isEqual(d.period, this.params.period) ?
              Colors.gray : Colors.lightGray
            ),
            stack: Text.fmtPeriod(d.period),
            index: d.period.index,
            data: _.map(d.groups.none, (wrapper) => ({
              name: Text.eventTitleForChart(wrapper.event),
              x: categories.length,
              y: EventStats.toHours(wrapper.duration)
            }))
          })
        );
        categories.push("Unlabeled Events");
      }

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
