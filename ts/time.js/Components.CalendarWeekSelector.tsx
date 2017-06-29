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
    range?: boolean;
    selected?: [Date, Date];
    min: Date;
    max: Date;
  }

  interface State {
    lastSelected?: [Date, Date];
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
      this.onSelect(start, end);
    }

    onSelect(start: Date, end: Date) {
      if (this.props.range) {
        if (this.state.lastSelected &&
            end.getTime() > this.state.lastSelected[1].getTime())
        {
          this.props.onWeekSelect(this.state.lastSelected[0], end);
        } else {
          this.setState({
            hover: this.state.hover,
            lastSelected: [start, end]
          });
        }
      } else {
        this.props.onWeekSelect(start, end);
      }
    }

    onDayOver(d: Date) {
      var start = moment(d).startOf('week').toDate();
      var end = moment(d).endOf('week').toDate();
      this.setState({ hover: [start, end] })
    }

    onDayOut(d: Date) {
      let dayTime = d.getTime();
      if (this.state.hover &&
          this.state.hover[0].getTime() <= dayTime &&
          this.state.hover[1].getTime() >= dayTime) {
        this.setState({ hover: null });
      }
    }

    fmtDayNumber(day: Date) {
      var mDay = moment(day).startOf('day');
      var classNames = ["day-number"];
      if (this.isHighlighted(day)) {
        classNames.push("active");
      }

      return <div className={classNames.join(" ")}>
        { moment(day).format("D") }
      </div>;
    }


    isHighlighted(day: Date) {
      let dayTime = day.getTime();

      // Hovering over => highlight
      let hover = this.state.hover;
      if (hover &&
          dayTime >= hover[0].getTime() &&
          dayTime <= hover[1].getTime()) {
        return true;
      }

      // Previous selection, highlight if covered by hover range
      let lastSelected = this.state.lastSelected;
      if (lastSelected && hover &&
          dayTime >= lastSelected[0].getTime() &&
          dayTime <= hover[1].getTime()) {
        return true;
      }

      // If currently selected (and no other selection), highlight
      let selected = this.props.selected;
      if (!lastSelected && selected &&
          dayTime >= selected[0].getTime() &&
          dayTime <= selected[1].getTime()) {
        return true;
      }

      return false;
    }
  }
}
