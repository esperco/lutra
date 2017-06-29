/*
  A week view component similar to Google Calendar's. Strictly speaking,
  doesn't have to be a week, just a series of dates in a row.
*/

/// <reference path="./Types.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Stores.Events.ts" />
/// <reference path="./Util.ts" />

module Esper.Components {

  /*
    To render any given event within a week view, we need to know how it
    overlaps other events -- namely, how many events it overlaps, and far
    over in the "stack" it is.

    Ignores all-day events.
  */
  interface StackItem {
    event: Types.TeamEvent;
    stackIndex: number;
    stackHeight: number;
  }

  function getStack(events: Types.TeamEvent[]): StackItem[] {
    let ret: StackItem[] = [];
    let stack: StackItem[] = [];
    let currentEnd = 0;

    _.each(events, (e) => {
      if (e.allDay) { return; }

      let start = e.start.getTime();
      if (start < currentEnd) {
        _.each(stack, (s) => s.stackHeight += 1);
      } else {
        stack = [];
      }

      currentEnd = Math.max(currentEnd, e.end.getTime());
      let newItem: StackItem = {
        event: e,
        stackIndex: stack.length + 1,
        stackHeight: stack.length + 1
      };
      stack.push(newItem);
      ret.push(newItem);
    });

    return ret;
  }


  ////////

  interface DayProps {
    date: Date;
    events: Types.TeamEvent[];
  }

  interface WeekProps {
    eventDates: DayProps[];
  }

  interface EventProps extends StackItem {
    date: Date;
  }

  interface SharedProps {
    renderEvent: (event: Types.TeamEvent, date: Date) => JSX.Element;
  }

  export function WeekView(props: WeekProps & SharedProps) {
    return <div className="week-view">
      <WeekHeadings dates={_.map(props.eventDates, (e) => e.date)} />
      <div className="week-scrollable">
        <WeekAllDays {...props} />
        <div className="week-tick-labels">
          <TimeTicks />
        </div>
        <div className="week-stacked-events">
          {
            _.map(props.eventDates, (ed) =>
            <WeekDateEvents key={ed.date.getTime()}
              { ...ed } renderEvent={props.renderEvent}
            />)
          }
        </div>
      </div>
    </div>;
  }

  // Sun, Mon, Tue, Wed, etc.
  function WeekHeadings({dates} : {dates: Date[]}) {
    let today = moment().startOf('day').valueOf();
    return <div className="week-headings">
      { _.map(dates, (d) => <div key={d.getTime()}
        className={classNames("week-date", {
          today: moment(d).startOf('day').valueOf() === today
        })}>
          { moment(d).format("ddd MMM D") }
        </div>) }
    </div>;
  }

  /*
    Render all day separately since we need to expand based on max number
    of all-day events for a given day
  */
  function WeekAllDays(props: WeekProps & SharedProps) {
    return <div className="week-all-days">
      { _.map(props.eventDates, (e, i) => <WeekAllDay key={i}
        { ...e } renderEvent={props.renderEvent}
      /> )}
    </div>;
  }

  function WeekAllDay(props: DayProps & SharedProps) {
    let events = _.filter(props.events,
      (e) => e.allDay && e.start.getDay() === props.date.getDay()
    );
    return <div className="week-all-day">
      { _.map(events, (e) => <div key={Stores.Events.strId(e)}
                                  className="all-day-event">
        { props.renderEvent(e, props.date) }
      </div>) }
    </div>;
  }

  function WeekDateEvents(props: DayProps & SharedProps) {
    let stack = getStack(props.events);
    return <div className="week-date-events">
      <TimeTicks />
      { _.map(stack, (s) => <StackedEvent key={Stores.Events.strId(s.event)}
        date={props.date}
        renderEvent={props.renderEvent}
        { ...s }
      />)}
    </div>
  }

  function TimeTicks({} : {}) {
    return <div className="time-ticks">
      { _.map(_.range(0, 24), (n) => <div key={n} className="hour-tick">
        <span className="hour-label">
          { moment().hour(n).minute(0).format("LT") }
        </span>
        <div className="half-hour-tick" />
      </div>)}
    </div>;
  }


  // Milliseconds in a day
  const DayTotal = (24 * 60 * 60 * 1000);

  function StackedEvent(props: EventProps & SharedProps) {
    let width = 1 / props.stackHeight;
    let left = width * (props.stackIndex - 1);
    let mStart = moment(props.event.start)
    let start = (mStart.hour() * 60 + mStart.minute()) * 60 * 1000;
    let duration = props.event.end.getTime() - props.event.start.getTime();
    let style = {
      top: toPercent(start / DayTotal),
      height: toPercent(duration / DayTotal),
      left: toPercent(left),
      width: toPercent(width),
    };
    return <div className="stacked-event" style={style}>
      { props.renderEvent(props.event, props.date) }
    </div>;
  }

  function toPercent(n: number): string {
    return Util.roundStr(n * 100, 2) + "%";
  }
}
