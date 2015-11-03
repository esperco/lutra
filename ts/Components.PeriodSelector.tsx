/*
  Component for selecting a time period for time stats
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Components {
  // Shorten references
  var Component = ReactHelpers.Component;

  interface PeriodSelectorProps {
    selected: TimeStats.Interval;
    updateFn(value: TimeStats.Interval): void;
  }

  export class PeriodSelector extends Component<PeriodSelectorProps, {}>
  {
    render() {
      return <div className="btn-group">
        {this.renderButton("Days", TimeStats.Interval.DAILY)}
        {this.renderButton("Weeks", TimeStats.Interval.WEEKLY)}
        {this.renderButton("Months", TimeStats.Interval.MONTHLY)}
      </div>
    }

    renderButton(text: string, interval: TimeStats.Interval) {
      var isSelected = this.props.selected === interval;
      return <button type="button"
          onClick={() => {this.props.updateFn(interval)}}
          className={"btn btn-default " + (isSelected ? "active" : "")}>
        {text}
      </button>;
    }
  }
}