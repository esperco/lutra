/*
  Charts for showing meetings grouped by number of guests
*/

module Esper.Components {

  function getBucket(label: string) {
    return _.find(EventStats.GuestCountDurationCalc.BUCKETS,
      (b) => b.label === label
    );
  }

  export class GuestCountHoursChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = _.map(EventStats.GuestCountDurationCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventSeries(groups, {
        colorFn: (key) => getBucket(key) ? getBucket(key).color : "",
        noneName: Text.NoGuests,
        noneStart: true,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <AbsoluteChart
          series={series}
          categories={[Text.NoGuests].concat(keys)}
          orientation="vertical"
          yAxis={`${Text.ChartGuestsCount} (${Text.hours()})`}
        />
      </div>;
    }
  }


  export class GuestCountPercentChart extends DefaultChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = _.map(EventStats.GuestCountDurationCalc.BUCKETS,
        (b) => b.label
      );
      var series = Charting.eventGroupSeries(groups, {
        colorFn: (key) => getBucket(key) ? getBucket(key).color : "",
        noneName: Text.NoGuests,
        noneStart: true,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        <TotalsBar periodTotals={groups} />
        <PercentageChart
          series={series}
          yAxis={`${Text.ChartGuestsCount} (${Text.ChartPercentage})`}
        />
      </div>;
    }
  }


  export class GuestCountEventGrid extends EventGrid<{}> {
    colorFn(groups: Option.T<string[]>) {
      return this.toBucket(groups).match({
        none: () => Colors.lightGray,
        some: (bucket) => {
          return bucket.color
        }
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return this.toBucket(groups).match({
        none: () => Colors.lightGray,
        some: (bucket) => `${bucket.label} ${Text.Guests}`
      });
    }

    toBucket(groups: Option.T<string[]>) {
      return groups.flatMap((g) => {
        return Option.wrap(getBucket(g[0]));
      });
    }
  }

}
