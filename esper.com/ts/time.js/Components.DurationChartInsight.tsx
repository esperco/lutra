/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {

  export class DurationChartInsight extends ChartGroupingInsight<{}> {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      // Current group only
      let periodGroup = _.find(groups, (g) => g.current);
      if (! periodGroup) return <span />;

      /*
        Sort annotations by bucket, then duration (event in long bucket may
        have short duration because of overlap)
      */
      let annotations = _(EventStats.DURATION_BUCKETS)
        .map((bucket) => periodGroup.data.some[bucket.label])
        .compact()
        .map((group) => _.sortBy(group.annotations, (a) => a.value))
        .flatten<Types.Annotation>()
        .value();

      let halfWay = 0.5 * periodGroup.data.totalValue;
      let soFar = 0;
      let halfWayAnnotation = _.findLast(annotations, (a) => {
        soFar += a.value;
        return soFar >= halfWay;
      });

      let bucket = halfWayAnnotation &&
        EventStats.getDurationBucket(halfWayAnnotation.event);
      if (halfWayAnnotation && !bucket) {
        Log.e(`Missing duration bucket`, {
          eventId: halfWayAnnotation.event.id,
          duration: halfWayAnnotation.value
        });
      }

      // Recalculate seconds since value corresponds to duration in chart,
      // not duration scheduled.
      let halfWaySeconds = (
        halfWayAnnotation.event.end.getTime()
        - halfWayAnnotation.event.start.getTime()
      ) / 1000;
      let mostlyLong = halfWaySeconds >
        EventStats.DURATION_BUCKETS[2].gte;
      console.info(halfWayAnnotation);

      return <div>
        <p>{ Text.ChartDurationDescription }</p>
        <p>{ bucket ?
          <span>
            At least half of your time is spent on events that last {" "}
            <Components.Badge
              color={bucket.color}
              text={Text.hoursOrMinutes(halfWaySeconds / 60)}
            />{" or "}{ mostlyLong ? "more" : "less"}.
          </span> :
          Text.ChartNoData
        }</p>
      </div>;
    }
  }
}
