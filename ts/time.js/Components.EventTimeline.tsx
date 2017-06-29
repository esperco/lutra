/*
  Chart-like object that just shows a timeline for all events
*/

module Esper.Components {
  const MAX_TICKS = 10;

  export function EventTimeline({group, props} : {
    group: Types.RangesGroup;
    props: Types.ChartProps;
  }) {
    var bounds = Period.bounds(props.period)
    var start = bounds[0].getTime() / 1000;
    var total = WeekHours.totalForRange(bounds);

    // Day blocks solely to demarcate day boundaries - inline
    var dates = Period.datesFromBounds(bounds[0], bounds[1]);
    var totalDates = dates.length;

    // Reduce dates to max ticks to avoid crowding
    if (dates.length > MAX_TICKS) {
      let interval = Math.max(Math.floor(dates.length / MAX_TICKS), 2);
      dates = _.filter(dates, (d, i) => i % interval == 0)
    }

    var dayBlocks = _.map(dates,
      (date) => <span key={date.getTime()} className="day-block"
        style={{
          left: (
            (moment(date).clone().startOf('day').unix() - start) / total
          ) * 100 + "%"
        }}
      >{ moment(date).format("M/D") }</span>
    );

    var keys = _.keys(group.some);
    var colors = props.groupBy.colorMapFn(keys, props);
    var colorMap = _.zipObject<string, Colors.ColorMap>(keys, colors);

    // Absolutely positioned on top of dayBlocks
    var eventBlocks = _(group.all.weights)
      .filter((w) => Stores.Events.isActive(w.event))
      .map((w) => <EventBlock key={Stores.Events.strId(w.event) + w.group}
        event={w.event}
        duration={w.value}
        color={colorMap[w.group as string]}
        start={start}
        total={total}
      />)
      .value();

    return <div className="event-bar-container">
      <div className="event-bar">
        { eventBlocks }
      </div>
      <div className="day-ticks">
        { dayBlocks }
      </div>
    </div>;
  }

  // A floating absolutely-positioned time for an event block
  function EventBlock({event, duration, color, start, total}: {
    event: Types.TeamEvent;
    duration: number; // Seconds
    color?: string;
    start: number;    // Start of entire timeline, seconds
    total: number;    // Total for entire timeline, seconds
  }) {
    let eventStart = Math.max((event.start.getTime() / 1000) - start, 0);

    // Clip so event duration doesn't go past total
    let eventDuration = Math.min(duration, total - eventStart);

    let style = {
      left: (eventStart / total) * 100 + "%",
      width: (eventDuration / total) * 100 + "%",
    };

    return <Tooltip style={style} className="time-block"
            title={event.title || Text.NoEventTitle}
            onClick={() => Charting.onEventClick(event)}>
      <span style={{background: color || Colors.lightGray}} />
    </Tooltip>;
  }
}
