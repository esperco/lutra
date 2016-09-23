/*
  Simple selector for a single week
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Dropdown.tsx" />
/// <reference path="../lib/Components.Selector.tsx" />
/// <reference path="./Components.CalendarDaySelector.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface Props {
    onWeekSelect: (start: Date, end: Date) => void;
    formatHeading?: string;
    formatMonth?: string;
    selected?: [Date, Date];
    min: Date;
    max: Date;
  }

  interface State {
    hover?: [Date, Date];
  }

  export class CalendarWeekSelector extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {};
    }

    render() {
      return <div className="cal-range-selector">
        <CalendarDaySelector
          min={this.props.min}
          max={this.props.max}
          initDate={this.props.selected ? this.props.selected[0] : null}
          onDayClick={(d) => this.onDayClick(d)}
          onDayOver={(d) => this.onDayOver(d)}
          onDayOut={(d) => this.onDayOut(d)}
          dayNumberFn={(d) => this.fmtDayNumber(d)}
          formatHeading={this.props.formatHeading}
          formatMonth={this.props.formatMonth}
        />
      </div>;
    }

    onDayClick(d: Date) {
      var start = moment(d).startOf('week').toDate();
      var end = moment(d).endOf('week').toDate();
      this.props.onWeekSelect(start, end);
    }

    onDayOver(d: Date) {
      var start = moment(d).startOf('week').toDate();
      var end = moment(d).endOf('week').toDate();
      this.setState({ hover: [start, end] })
    }

    onDayOut(d: Date) {
      this.setState({ hover: null })
    }

    fmtDayNumber(day: Date) {
      var mDay = moment(day).startOf('day');
      var classNames = ["day-number"];

      var hover = this.state.hover;
      var selected = this.props.selected;

      if ((hover &&
           day.getTime() >= hover[0].getTime() &&
           day.getTime() <= hover[1].getTime()) ||
          (selected &&
           day.getTime() >= selected[0].getTime() &&
           day.getTime() <= selected[1].getTime())) {
        classNames.push("active");
      }

      return <div className={classNames.join(" ")}>
        { moment(day).format("D") }
      </div>;
    }
  }
}
