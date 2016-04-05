/*
  Component for selecting an interval -- use in conjunction with
  Components.PeriodSelector
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  export class IntervalSelector extends ReactHelpers.Component<{
    id?: string;
    className?: string;
    show?: Period.Interval[];
    hideWeek?: boolean;
    hideMonth?: boolean;
    hideQuarter?: boolean;
    period: Period.Single;
    updateFn: (period: Period.Single) => void;
  }, {}> {

    render() {
      return <div className={ this.props.className }>
        { this.renderIntervalLink("week", "Week") }
        { this.renderIntervalLink("month", "Month") }
        { this.renderIntervalLink("quarter", "Quarter") }
      </div>;
    }

    renderIntervalLink(interval: Period.Interval, text: string) {
      var show = this.props.show || ["week", "month", "quarter"];
      if (! _.includes(show, interval)) {
        return <span />;
      }
      return <a
        className={"esper-subheader-link" + (
          this.props.period.interval === interval ? " active" : ""
        )}
        onClick={() => this.onIntervalClick(interval)}>
        { text }
      </a>
    }

    onIntervalClick(interval: Period.Interval) {
      this.props.updateFn(Period.current(interval))
    }
  }
}
