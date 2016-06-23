/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class DurationHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var series = Charting.eventSeries(groups, {

        // Ignore actual keys here and just use the default bucket list
        sortFn: () => _.map(EventStats.DurationBucketCalc.BUCKETS,
          (b) => b.label
        ),

        yFn: EventStats.toHours
      });

      return <AbsoluteChart
        series={series} orientation="vertical"
        yAxis={`${Text.ChartDuration} (${Text.hours()})`}
      />;
    }
  }


  export class DurationPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var series = Charting.eventGroupSeries(groups, {
        // Ignore actual keys here and just use the default bucket list
        sortFn: () => _.map(EventStats.DurationBucketCalc.BUCKETS,
          (b) => b.label
        ),

        yFn: EventStats.toHours
      });

      return <PercentageChart
        series={series}
        yAxis={`${Text.ChartDuration} (${Text.ChartPercentage})`}
      />;
    }
  }
}
