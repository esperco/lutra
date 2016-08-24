/*
  Chart that just shows a stacked bar chart for durations based on buckets
*/

module Esper.Components {
  export class DurationStack extends ChartGroupingInsight<{}> {
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

      return <div className="event-stack">
        { _.map(annotations, (a) => <EventBlock key={a.event.id}
          annotation={a}
        />) }
      </div>;
    }
  }

  // Block for a single event -> use flex-list to control spacing
  function EventBlock({annotation} : {annotation: Types.Annotation}) {
    let bucket = EventStats.getDurationBucket(annotation.event);
    if (! bucket) {
      Log.e("Missing duration bucket", {
        eventId: annotation.event.id,
        value: annotation.value
      });
      return <span />;
    }

    let title = annotation.event.title || Text.NoEventTitle;
    let minutes = (annotation.event.end.getTime() -
      annotation.event.start.getTime()) / 60000;
    title += ` (${Text.hoursOrMinutes(minutes)})`;

    return <Tooltip title={title}
      style={{ flexBasis: annotation.value }}
      className="event-block"
    >
      <span style={{background: bucket.color}} />
    </Tooltip>;
  }
}
