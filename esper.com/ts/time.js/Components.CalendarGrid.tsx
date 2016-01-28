/*
  Simple calendar grid for charting purposes
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface CalendarGridProps {
    date: Date; // A date in the calendar month we want to show
    dayFn: (m: moment.Moment) => JSX.Element;
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

      return <div className="calendar-grid-holder">
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
          {moment().weekday(i).format('ddd')}
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
      return <td key={day.toISOString()} className={"cal-day " +
                 (inMonth ? "in-month": "out-month")}>
        <div className="day-header">
          {day.format("D")}
        </div>
        { inMonth ? this.props.dayFn(day) : null }
      </td>;
    }
  }
}
