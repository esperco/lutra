/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {

  export class GuestCountChartInsight
    extends ChartInsight<[Types.TeamEvent, number][], {}>
  {
    renderMain(data: Charting.PeriodData<[Types.TeamEvent, number][]>[]) {
      // Current group only
      let periodGroup = _.find(data, (g) => g.current);
      if (! periodGroup) return <span />;

      // Get median count -- ignore empty events
      let sorted = _(periodGroup.data)
        .filter((d) => d[1] > 1)
        .sortBy((d) => d[1])
        .value();

      let median = sorted[Math.floor(sorted.length / 2)];
      let medianBucket = median && EventStats.getGuestCountBucket(median[0]);
      let medianCount = median && median[1];

      let max = sorted[sorted.length - 1];
      let maxBucket = max && EventStats.getGuestCountBucket(max[0]);
      let maxCount = max && max[1];

      // Sanity check
      if (sorted.length && (!medianBucket || !maxBucket)) {
        if (! medianBucket) {
          Log.e(`Missing bucket for ${medianCount} guests`);
        }
        if (! maxBucket) {
          Log.e(`Missing bucket for ${maxCount} guests`);
        }
      }

      return <div>
        <p>{ Text.ChartGuestsCountDescription }</p>
        <p>{ sorted.length && medianBucket && maxBucket ?
          <span>
            Your median event has{" "}<Components.Badge
              color={medianBucket.color}
              text={ medianCount + " " + Text.Guests } /> invited.

            Your largest event { maxCount == medianCount ? " also " : " "}
            has{" "} <Components.Badge
              color={maxBucket.color}
              text={ maxCount + " " + Text.Guests }
            /> invited.
          </span> :
          Text.ChartNoGuests
        }</p>
      </div>;
    }
  }
}
