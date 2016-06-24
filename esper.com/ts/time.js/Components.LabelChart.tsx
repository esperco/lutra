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

      return <AbsoluteChart
        orientation="horizontal"
        series={series}
        categories={keys}
        yAxis={`${Text.ChartLabels} (${Text.hours()})`}
      />;
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

      return <PercentageChart
        series={series}
        yAxis={`${Text.ChartLabels} (${Text.ChartPercentage})`}
      />;
    }
  }
}
