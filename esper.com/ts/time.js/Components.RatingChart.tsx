/*
  Histogram for showing event durations
*/

/// <reference path="./Components.Chart.tsx" />
/// <reference path="./Components.EventGrid.tsx" />
/// <reference path="./Text.ts" />

module Esper.Components {
  function displayNameForRating(rating: string) {
    return _.capitalize(Text.stars(parseInt(rating)));
  }

  function colorForRating(rating: string) {
    switch (rating) { // Inverse color levels (level1 is OK, level5 is severe)
      case "5":
        return Colors.level1;
      case "4":
        return Colors.level2;
      case "3":
        return Colors.level3;
      case "2":
        return Colors.level4;
      case "1":
        return Colors.level5;
      default:
        return Colors.lightGray;
    }
  }

  const RATINGS = ["1", "2", "3", "4", "5"];
  const CATEGORIES = _.map(RATINGS, (r) => displayNameForRating(r));

  export class RatingHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var series = Charting.eventSeries(groups, {
        colorFn: colorForRating,
        displayName: displayNameForRating,
        noneName: Text.NoRating,
        sortedKeys: RATINGS,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <AbsoluteChart
          series={series} categories={CATEGORIES} orientation="vertical"
          yAxis={`${Text.ChartRatings} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }


  export class RatingPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var series = Charting.eventGroupSeries(groups, {
        colorFn: colorForRating,
        displayName: displayNameForRating,
        noneName: Text.NoRating,
        sortedKeys: RATINGS,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <PercentageChart
          series={series}
          yAxis={`${Text.ChartRatings} (${Text.ChartPercentUnit})`}
        />
      </div>;
    }
  }


  export class RatingEventGrid extends EventGrid<{}> {
    colorFn(groups: Option.T<string[]>) {
      return this.toRating(groups).match({
        none: () => Colors.lightGray,
        some: (s) => colorForRating(s)
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return this.toRating(groups).match({
        none: () => Text.NoRating,
        some: (s) => displayNameForRating(s)
      });
    }

    toRating(groups: Option.T<string[]>) {
      return groups.flatMap((g) => Option.wrap(g[0]));
    }
  }
}
