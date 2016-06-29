/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class LabelHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventSeries(groups, {
        colorFn: Colors.getColorForLabel,
        displayName: Labels.getDisplayAs,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <AbsoluteChart
          orientation="horizontal"
          series={series}
          categories={keys}
          yAxis={`${Text.ChartLabels} (${Text.hours()})`}
        />
      </div>;
    }
  }

  export class LabelPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventGroupSeries(groups, {
        colorFn: Colors.getColorForLabel,
        displayName: Labels.getDisplayAs,
        noneName: Text.Unlabeled,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <PercentageChart
          series={series}
          yAxis={`${Text.ChartLabels} (${Text.ChartPercentage})`}
        />
      </div>;
    }
  }

  export class LabelEventGrid extends EventGrid {
    colorFn(groups: Option.T<string[]>) {
      return groups.match({
        none: () => Colors.lightGray,
        some: (g) => g[0] ? Colors.getColorForLabel(g[0]) : Colors.gray,
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return groups.match({
        none: () => "",
        some: (g) => g[0] ? Labels.getDisplayAs(g[0]) : Text.Unlabeled
      });
    }
  }
}
