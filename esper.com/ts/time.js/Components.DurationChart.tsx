/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
/// <reference path="./Components.EventGrid.tsx" />

module Esper.Components {

  function getBucket(label: string) {
    return _.find(EventStats.DurationBucketCalc.BUCKETS,
      (b) => b.label === label
    );
  }

  export class DurationHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = _.map(EventStats.DurationBucketCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventSeries(groups, {
        colorFn: (key) => getBucket(key) ? getBucket(key).color : "",
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <AbsoluteChart
          series={series} categories={keys} orientation="vertical"
          simplified={this.props.simplified}
          yAxis={`${Text.ChartDuration} (${Text.ChartHoursUnit})`}
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
        colorFn: (key) => getBucket(key) ? getBucket(key).color : "",
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <PercentageChart
          series={series}
          simplified={this.props.simplified}
          yAxis={`${Text.ChartDuration} (${Text.ChartPercentUnit})`}
        />
      </div>;
    }
  }


  export class DurationEventGrid extends EventGrid<{}> {
    colorFn(groups: Option.T<string[]>) {
      return this.toBucket(groups).match({
        none: () => Colors.lightGray,
        some: (bucket) => {
          return bucket.color
        }
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return ""; // No need for label since duration always shown
    }

    toBucket(groups: Option.T<string[]>) {
      return groups.flatMap((g) => {
        return Option.wrap(getBucket(g[0]));
      });
    }
  }
}
