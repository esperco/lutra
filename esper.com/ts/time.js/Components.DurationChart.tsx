/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  type Calc = EventStats.DurationBucketCalc;

  export class DurationHoursChart extends Chart<Calc> {
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


  export class DurationPercentChart extends Chart<Calc> {
    renderMain(groups: Charting.PeriodGroup[]) {

      var series = Charting.eventGroupSeries(groups, {
        // Ignore actual keys here and just use the default bucket list
        sortFn: () => _.map(EventStats.DurationBucketCalc.BUCKETS,
          (b) => b.label
        ),

        yFn: EventStats.toHours
      });

      return <Components.Highchart opts={{
        chart: groups.length > 1 ? {
          type: 'bar',
          height: groups.length * 100 + 120
        } : {
          type: 'pie'
        },

        plotOptions: {
          bar: {
            stacking: 'percent',
            borderWidth: 1
          },

          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              formatter: function() {
                if (this.percentage) {
                  return `${this.point.name} ` +
                    `(${Util.roundStr(this.percentage, 1)}%)`;
                }
              }
            },
            size: '80%'
          }
        },

        legend: {
          enabled: false
        },

        xAxis: {
          categories: _.map(groups, (g) => Text.fmtPeriod(g.period))
        },

        yAxis: {
          title: { text: "Percentage" }
        },

        tooltip: Charting.countPointTooltip,

        series: series
      }} />;
    }
  }
}
