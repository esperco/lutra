/*
  Simple selector for a single day
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Components.CalendarGrid.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface Props {
    onDayClick: (d: Date) => void;
    onDayOver?: (d: Date) => void;
    onDayOut?: (d: Date) => void;
    dayNumberFn?: (d: Date) => JSX.Element;
    dayFn?: (d: Date) => JSX.Element;
    formatHeading?: string;
    formatMonth?: string;
    initDate?: Date;
    min: Date;
    max: Date;
  }

  export class CalendarDaySelector extends ReactHelpers.Component<Props, {
    currentMonth: moment.Moment;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = {
        currentMonth: props.initDate ? moment(props.initDate) : moment()
      };
    }

    render() {
      return <div className="cal-day-selector">
        <div className="cal-month-selector">
          { this.atMin() ? null :
            <span className="action prev-month pull-left"
                  onClick={() => this.incr(-1)}>
              <i className="fa fa-fw fa-caret-left" />
            </span>
          }

          <span className="month-text">
            { moment(this.state.currentMonth)
              .format(this.props.formatMonth || 'MMM YYYY') }
          </span>

          { this.atMax() ? null :
            <span className="action next-month pull-right"
                  onClick={() => this.incr(1)}>
              <i className="fa fa-fw fa-caret-right" />
            </span>
          }
        </div>
        <CalendarGrid
          date={this.state.currentMonth.toDate()}
          formatHeading={this.props.formatHeading || "dd"}
          onDayClick={this.props.onDayClick}
          onDayOver={this.props.onDayOver}
          onDayOut={this.props.onDayOut}
          dayNumberFn={this.props.dayNumberFn}
          dayFn={this.props.dayFn}
        />
      </div>;
    }

    atMin() {
      return this.state.currentMonth.clone().subtract(1, 'month')
        .diff(moment(this.props.min)) < 0;
    }

    atMax() {
      return this.state.currentMonth.clone().add(1, 'month')
        .diff(moment(this.props.max)) > 0;
    }

    incr(num: number) {
      this.setState({
        currentMonth: this.state.currentMonth.clone().add(num, 'month')
      });
    }
  }
}
