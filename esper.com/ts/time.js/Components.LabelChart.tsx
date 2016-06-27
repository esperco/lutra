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
}
