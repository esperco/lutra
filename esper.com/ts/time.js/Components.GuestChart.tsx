/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
module Esper.Components {

  export class GuestHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var keys = Charting.sortKeys(groups);
      var series = Charting.eventSeries(groups, {
        colorFn: (k) => Colors.getColorForDomain(k.split('@')[1] || k),
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <AbsoluteChart
        orientation="horizontal"
        series={series}
        categories={keys}
        yAxis={`${Text.ChartGuests} (${Text.hours()})`}
      />;
    }
  }

  export class GuestPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodGroup[]) {
      var keys = Charting.sortKeys(groups);
      var series = Charting.eventGroupSeries(groups, {
        colorFn: Colors.getColorForDomain,
        noneName: Text.NoGuests,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <PercentageChart
        series={series}
        yAxis={`${Text.ChartGuests} (${Text.ChartPercentage})`}
      />;
    }
  }
}
