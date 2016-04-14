/*
  Simple selector for a range of dates
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />
/// <reference path="../common/Components.Selector.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./Components.CalendarDaySelector.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface Props {
    onRangeSelect: (start: Date, end: Date) => void;
    formatHeading?: string;
    formatMonth?: string;
    selected?: [Date, Date];
    min: Date;
    max: Date;
  }

  interface State {
    start?: moment.Moment;
    end?  : moment.Moment;
    hover?: moment.Moment;
  }

  export class CalendarRangeSelector extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {};

      if (props.selected) {
        this.state.start = moment(props.selected[0]);
        this.state.end = moment(props.selected[1]);
      }
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
      var mDay = moment(d).startOf('day');
      if (this.state.start && !this.state.end &&
          mDay.diff(this.state.start) > 0) {
        this.setState({ end: mDay })
        this.props.onRangeSelect(this.state.start.toDate(), mDay.toDate());
      } else {
        this.setState({ start: mDay, end: null });
      }
    }

    onDayOver(d: Date) {
      this.setState({ hover: moment(d) })
    }

    onDayOut(d: Date) {
      this.setState({ hover: null })
    }

    fmtDayNumber(day: Date) {
      var mDay = moment(day).startOf('day');
      var classNames = ["day-number"];

      var hover = this.state.hover;
      hover = hover && hover.clone().startOf('day');

      var start = this.state.start;
      start = start ? start.clone().startOf('day') : hover;

      var end = this.state.end;
      end = end ? end.clone().startOf('day') : hover;

      if (hover && hover.isSame(mDay)) {
        classNames.push("active");
        if (hover.diff(start) < 0 || hover.diff(end) > 0) {
          classNames.push("active-start");
          classNames.push("active-end");
        }
      }
      if (start && start.isSame(mDay)) {
        classNames.push("active")
        classNames.push("active-start");
      }
      if (end && end.isSame(mDay)) {
        classNames.push("active");
        classNames.push("active-end");
      }
      if (end && start.diff(mDay) < 0 && end.diff(mDay) > 0) {
        classNames.push("active");
      }

      return <div className={classNames.join(" ")}>
        { moment(day).format("D") }
      </div>;
    }
  }


  /////

  export class CalendarRangeSelectorDropdown extends Component<Props, {}> {
    _dropdownModal: DropdownModal;

    render() {
      var selectedText = "";
      if (this.props.selected) {
        let start  = this.props.selected[0];
        let end    = this.props.selected[1];
        selectedText = `${Text.date(start)} - ${Text.date(end)}`;
      }

      return <DropdownModal
              ref={ (c) => this._dropdownModal = c }
              keepOpen={true}>
        <Selector id={this.getId("")} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu calendar-selector-menu">
          { React.createElement(CalendarRangeSelector, this.props) }
        </div>
      </DropdownModal>;
    }
  }
}
