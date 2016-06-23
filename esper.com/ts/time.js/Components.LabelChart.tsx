/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class LabelHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var series = Charting.eventSeries(groups, {
        displayName: Labels.getDisplayAs,
        yFn: EventStats.toHours
      });

      return <AbsoluteChart
        series={series} orientation="horizontal"
        yAxis={`${Text.ChartLabels} (${Text.hours()})`}
      />;
    }
  }

  export class LabelPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var series = Charting.eventGroupSeries(groups, {
        displayName: Labels.getDisplayAs,
        noneName: Text.Unlabeled,
        yFn: EventStats.toHours
      });

      return <PercentageChart
        series={series}
        yAxis={`${Text.ChartLabels} (${Text.ChartPercentage})`}
      />;
    }
  }
}
