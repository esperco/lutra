/*
  Simple interface for selecting a time period
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Components {
  // Shorten references
  var Component = ReactHelpers.Component;

  interface ButtonProps {
    text: string;
    period: TimeStats.TypedStatRequest;
  }

  interface PeriodSelectorProps {
    selected: TimeStats.TypedStatRequest;
    buttons?: ButtonProps[];
    updateFn(value: TimeStats.TypedStatRequest): void;
  }

  var defaultButtons: ButtonProps[] = [
    { text: "Days",
      period: TimeStats.intervalCountRequest(5, TimeStats.Interval.DAILY)
    },
    { text: "Weeks",
      period: TimeStats.intervalCountRequest(5, TimeStats.Interval.WEEKLY)
    },
    { text: "Months",
      period: TimeStats.intervalCountRequest(5, TimeStats.Interval.MONTHLY)
    }
  ];

  export class PeriodSelector extends Component<PeriodSelectorProps, {}>
  {
    render() {
      var buttons = this.props.buttons || defaultButtons;
      return <div className="btn-group">
        { _.map(buttons, this.renderButton.bind(this)) }
      </div>
    }

    renderButton(button: ButtonProps) {
      var isSelected = _.eq(this.props.selected, button.period);
      return <button type="button" key={button.text}
          onClick={() => {this.props.updateFn(button.period)}}
          className={"btn btn-default " + (isSelected ? "active" : "")}>
        { button.text }
      </button>;
    }
  }
}