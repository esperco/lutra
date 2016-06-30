/*
  Simple calendar grid for charting purposes
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface CalendarGridProps {
    date: Date; // A date in the calendar month we want to show
    dayNumberFn?: (d: Date) => JSX.Element;
    dayFn?: (d: Date) => JSX.Element;
    formatHeading?: string;
    onDayClick?: (d: Date) => void;
    onDayOver?: (d: Date) => void;
    onDayOut?: (d: Date) => void;
    className?: string;
  }

  export class CalendarGrid extends Component<CalendarGridProps, {}> {
    render() {
      var start = moment(this.props.date).clone()
        .startOf('month').startOf('week');
      var end = moment(this.props.date).clone().endOf('month');

      var weeks: JSX.Element[] = [];
      while (start <= end) {
        weeks.push(this.renderWeek(start.clone()));
        start.add(1, 'week');
      }

      return <div className={this.props.className || "calendar-grid-holder"}>
        <table className="calendar-grid">
          <thead>
            { this.renderHeadings() }
          </thead>
          <tbody>
            { weeks }
          </tbody>
        </table>
      </div>;
    }

    renderHeadings() {
      return <tr className="cal-header">{
        _.times(7, (i) => <th key={i.toString()}>
          {moment().weekday(i).format(this.props.formatHeading || 'ddd')}
        </th>)
      }</tr>;
    }

    renderWeek(start: moment.Moment) {
      var days: JSX.Element[] = [];
      var month = start.month();

      // Fill to end of week
      var start = start.clone();
      while (days.length < 7) {
        days.push(this.renderDay(start.clone()))
        start.add(1, 'day');
      }

      // Row = week
      return <tr key={start.toISOString()} className="cal-week">
        {days}
      </tr>;
    }

    renderDay(day: moment.Moment) {
      var inMonth = moment(this.props.date).month() === day.month();
      var classes = ["cal-day"];
      classes.push(inMonth ? "in-month": "out-month");
      if (day.clone().startOf('day').isSame(moment().startOf('day'))) {
        classes.push("today");
      }

      return <td key={day.toISOString()} className={classes.join(" ")}
                 onClick={() => this.handleDayClick(day) }
                 onMouseOver={() => this.handleDayOver(day)}
                 onMouseOut={() => this.handleDayOut(day)}>
        <div className="cal-day-content">
          {
            this.props.dayNumberFn ?
            this.props.dayNumberFn(day.toDate()) :
            <div className="day-number">
              { day.format("D") }
            </div>
          }
          { (inMonth && this.props.dayFn) ?
            this.props.dayFn(day.toDate()) : null }
        </div>
      </td>;
    }

    handleDayClick(day: moment.Moment) {
      if (this.props.onDayClick) {
        this.props.onDayClick(day.toDate());
      }
    }

    handleDayOver(day: moment.Moment) {
      if (this.props.onDayOver) {
        this.props.onDayOver(day.toDate());
      }
    }

    handleDayOut(day: moment.Moment) {
      if (this.props.onDayOut) {
        this.props.onDayOut(day.toDate());
      }
    }
  }
}
