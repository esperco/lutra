/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class DurationHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = _.map(EventStats.DurationBucketCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventSeries(groups, {
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <AbsoluteChart
          series={series} categories={keys} orientation="vertical"
          yAxis={`${Text.ChartDuration} (${Text.hours()})`}
        />
      </div>;
    }
  }


  export class DurationPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = _.map(EventStats.DurationBucketCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventGroupSeries(groups, {
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <PercentageChart
          series={series}
          yAxis={`${Text.ChartDuration} (${Text.ChartPercentage})`}
        />
      </div>;
    }
  }
}
