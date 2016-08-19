/*
  Chart-like object that just shows a stacked bar chart for all events
*/

module Esper.Components {
  const MAX_TICKS = 10;

  export function EventBar({period, events}: {
    period: Types.SinglePeriod|Types.CustomPeriod;
    events: Types.TeamEvent[];
  }) {
    var bounds = Period.boundsFromPeriod(period)
    var start = bounds[0].getTime() / 1000;
    var total = WeekHours.totalForPeriod(period);

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

    // Absolutely positioned on top of dayBlocks
    var eventBlocks = _(events)
      .filter((e) => Stores.Events.isActive(e))
      .map((e) => <EventBlock key={e.id}
        event={e}
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
  function EventBlock({event, start, total}: {
    event: Types.TeamEvent;
    start: number; // Seconds
    total: number; // Seconds
  }) {
    let eventStart = (event.start.getTime() / 1000) - start;

    // Clip so event duration doesn't go past total
    let eventDuration = Math.min(
      (event.end.getTime() - event.start.getTime()) / 1000,
      total - eventStart
    );

    let style = {
      left: (eventStart / total) * 100 + "%",
      width: (eventDuration / total) * 100 + "%"
    };

    return <Tooltip style={style} className="time-block"
            title={event.title || Text.NoEventTitle}
            onClick={() => Charting.onEventClick(event)}>
      <span />
    </Tooltip>;
  }
}
