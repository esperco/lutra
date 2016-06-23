/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  type Calc = EventStats.DurationBucketCalc;

  export class DurationChart extends Chart<Calc> {
    renderMain(groups: Charting.PeriodGroup[]) {
      var series = Charting.eventSeries(groups, {

        // Ignore actual keys here and just use the default bucket list
        sortFn: () => _.map(EventStats.DurationBucketCalc.BUCKETS,
          (b) => b.label
        ),

        yFn: EventStats.toHours
      });

      return <Components.Highchart opts={{
        chart: {
          type: 'column'
        },

        tooltip: Charting.eventPointTooltip,

        legend: {
          enabled: false
        },

        plotOptions: {
          column: {
            stacking: 'normal'
          }
        },

        xAxis: {
          categories: _.map(EventStats.DurationBucketCalc.BUCKETS,
            (b) => b.label
          )
        },

        yAxis: [{
          title: { text: "Duration (Hours)" }
        }],

        series: series
      }} />;
    }
  }
}
