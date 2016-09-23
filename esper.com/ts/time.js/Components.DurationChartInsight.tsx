/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {

  export class DurationChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByDuration; }

    render() {
      return this.getResult().match({
        none: () => null,
        some: (s) => {

          /*
            Sort annotations by bucket, then duration (event in long bucket may
            have short duration because of overlap)
          */
          let annotations = _(Charting.DURATION_BUCKETS)
            .map((bucket) => s.group.some[bucket.label])
            .compact()
            .map((group) => _.sortBy(group.weights, (a) => a.value))
            .flatten<Types.Weight>()
            .value();

          let halfWay = 0.5 * s.group.all.totalValue;
          let soFar = 0;
          let halfWayAnnotation = _.findLast(annotations, (a) => {
            soFar += a.value;
            return soFar >= halfWay;
          });

          let bucket = halfWayAnnotation &&
            Charting.getDurationBucket(halfWayAnnotation.event);
          if (halfWayAnnotation && !bucket) {
            Log.e(`Missing duration bucket`, {
              eventId: halfWayAnnotation.event.id,
              duration: halfWayAnnotation.value
            });
          }

          if (! bucket) {
            return <p>{ Text.ChartNoData }</p>;
          }

          // Recalculate seconds since value corresponds to duration in chart,
          // not duration scheduled.
          let halfWaySeconds = halfWayAnnotation && (
            halfWayAnnotation.event.end.getTime()
            - halfWayAnnotation.event.start.getTime()
          ) / 1000;
          let mostlyLong = halfWaySeconds && (halfWaySeconds >
            Charting.DURATION_BUCKETS[2].gte);

          return <div>
            <p>
              At least half of your time is spent on events that last {" "}
              <Components.Badge
                color={bucket.color}
                text={Text.hoursOrMinutes(halfWaySeconds / 60)}
              />{" or "}{ mostlyLong ? "more" : "less"}.
            </p>
          </div>;
        }
      });
    }
  }
}
