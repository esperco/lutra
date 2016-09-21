/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class LabelHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventSeries(groups, {
        colorFn: getLabelColor,
        displayName: Labels.getDisplayAs,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <AbsoluteChart
          orientation="horizontal"
          series={series}
          simplified={this.props.simplified}
          categories={keys}
          yAxis={`${Text.ChartLabels} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }

  export class LabelPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventGroupSeries(groups, {
        colorFn: getLabelColor,
        displayName: Labels.getDisplayAs,
        noneName: Text.Unlabeled,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <PercentageChart
          series={series}
          simplified={this.props.simplified}
          yAxis={`${Text.ChartLabels} (${Text.ChartPercentUnit})`}
        />
      </div>;
    }
  }

  function getLabelColor(key: string, extra : {
    index: number;
    total: number;
    event: Types.TeamEvent;
  }) {
    return extra.event ? extra.event.labelScores.match({
      none: () => Colors.lightGray,
      some: (labels) => {
        let label = _.find(labels, {id: key});
        if (!label) return Colors.lightGray;
        return label.color;
      }
    }) : Colors.lightGray;
  }

  export class LabelEventGrid extends EventGrid<{}> {
    categoryFn(groups: Option.T<string[]>) {
      return groups.match({
        none: () => "",
        some: (g) => g[0] ? Labels.getDisplayAs(g[0]) : Text.Unlabeled
      });
    }
  }
}
