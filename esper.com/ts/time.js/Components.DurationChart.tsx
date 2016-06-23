/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class DurationHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var keys = _.map(EventStats.DurationBucketCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventSeries(groups, {
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <AbsoluteChart
        series={series} categories={keys} orientation="vertical"
        yAxis={`${Text.ChartDuration} (${Text.hours()})`}
      />;
    }
  }


  export class DurationPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var keys = _.map(EventStats.DurationBucketCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventGroupSeries(groups, {
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <PercentageChart
        series={series}
        yAxis={`${Text.ChartDuration} (${Text.ChartPercentage})`}
      />;
    }
  }
}
