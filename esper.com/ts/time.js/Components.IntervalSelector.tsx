/*
  Component for selecting an interval -- use in conjunction with
  Components.PeriodSelector
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  interface BaseProps {
    id?: string;
    className?: string;
    show?: Period.IntervalOrCustom[];
    period: Period.Single|Period.Custom;
    updateFn: (period: Period.Single|Period.Custom) => void;
  }

  interface SingleOnlyProps extends BaseProps {
    show?: Period.Interval[];
    period: Period.Single;
    updateFn: (period: Period.Single) => void;
  }

  export class IntervalSelectorBase<T extends BaseProps>
    extends ReactHelpers.Component<T, {}> {

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
        <span>{ text[0] }</span>
        <span className="hidden-sm">{ text.slice(1) }</span>
      </a>
    }

    onIntervalClick(interval: Period.Interval) {
      this.props.updateFn(Period.current(interval))
    }
  }

  export class IntervalSelector
      extends IntervalSelectorBase<SingleOnlyProps> { }

  export class IntervalOrCustomSelector
      extends IntervalSelectorBase<BaseProps> {

    render() {
      return <div className={ this.props.className }>
        { this.renderIntervalLink("week", "Week") }
        { this.renderIntervalLink("month", "Month") }
        { this.renderIntervalLink("quarter", "Quarter") }
        { this.renderCustomLink() }
      </div>;
    }

    renderCustomLink() {
      if (this.props.show && !_.includes(this.props.show, "custom")) {
        return <span />;
      }

      return <a
        className={"esper-subheader-link" +
          (Period.isCustom(this.props.period) ? " active" : "")
        }
        onClick={() => this.onCustomClick()}>
        <span>C</span><span className="hidden-sm">ustom</span>
      </a>
    }

    onCustomClick() {
      this.props.updateFn(Period.current('custom'));
    }
  }
}
