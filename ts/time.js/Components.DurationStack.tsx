/*
  Chart that just shows a stacked bar chart for durations based on buckets
*/

module Esper.Components {
  interface Props extends Types.ChartProps {
    eventOnClick?: (event: Types.TeamEvent) => void;
  }

  export class DurationStack extends DataChart<Types.GroupState, Props> {
    getCalc(props: Types.ChartProps): Calc<Types.GroupState> {
      props = _.clone(props);
      props.groupBy = Charting.GroupByDuration;
      return EventStats.defaultGroupDurationCalc(
        props.eventsForRanges,
        Charting.getFilterFns(props),
        (e) => props.groupBy.keyFn(e, props)
      )
    }

    renderResult(s: Types.GroupState) {
      /*
        Sort weights by bucket, then duration (event in long bucket may
        have short duration because of overlap)
      */
      let weights = _(Charting.DURATION_BUCKETS)
        .map((bucket) => s.group.some[bucket.label])
        .compact()
        .map((group) => _.sortBy(group.weights, (w) => w.value))
        .flatten<Types.Weight>()
        .value();

      if (_.isEmpty(weights)) return <span />;

      return <div className="event-stack">
        { _.map(weights, (a) =>
          <EventBlock key={Stores.Events.strId(a.event)}
            weight={a} onClick={this.props.eventOnClick}
          />) }
      </div>;
    }
  }

  // Block for a single event -> use flex-list to control spacing
  function EventBlock({weight, onClick} : {
    weight: Types.Weight;
    onClick: (event: Types.TeamEvent) => void;
  }) {
    let bucket = Charting.getDurationBucket(weight.event);
    if (! bucket) {
      Log.e("Missing duration bucket", {
        eventId: weight.event.id,
        value: weight.value
      });
      return <span />;
    }

    let title = weight.event.title || Text.NoEventTitle;
    let minutes = (weight.event.end.getTime() -
      weight.event.start.getTime()) / 60000;
    title += ` (${Text.hoursOrMinutes(minutes)})`;

    return <Tooltip title={title}
      style={{ flexBasis: weight.value }}
      className="event-block"
    >
      <span
        className={onClick ? "action" : ""}
        style={{background: bucket.color}}
        onClick={() => onClick(weight.event)}
      />
    </Tooltip>;
  }
}
