/*
  Used with charts to show the total number of events / hours shown in chart
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  export module Types {
    export interface PeriodTotal {
      period: Period.Single|Period.Custom;
      duration: number; // seconds
      count: number;
    }
  }

  interface Props {
    periodTotals: Types.PeriodTotal[];
  }

  export class TotalsBar extends ReactHelpers.Component<Props, {}> {
    render() {
      var totals = _.sortBy(this.props.periodTotals,
        (p) => Period.asNumber(p.period)
      );
      return <div className="totals-bar">
        { _.map(totals, (total, i) =>
          <div className="period-total" key={i}>
            <span className="period-desc">
              {
                totals.length > 1 ?
                Text.fmtPeriod(total.period, true) :
                "Total"
              }
            </span>
            <span className="total-hours">
              <i className="fa fa-fw fa-clock-o" />{" "}
              <TotalHours short={totals.length > 1}
                          duration={total.duration} />
            </span>
            <span className="total-count">
              <i className="fa fa-fw fa-calendar-o" />{" "}
              <TotalEvents short={totals.length > 1}
                           count={total.count} />
            </span>
          </div>
        )}
      </div>
    }
  }

  function TotalHours({short, duration}: {
    short?: boolean; duration: number;
  }) {
    var hours = EventStats.toHours(duration);
    var shortText = Text.hoursShort(hours);
    var longText = Text.hours(hours);
    if (short) {
      return <ValueTooltip tooltip={longText}>
        { shortText }
      </ValueTooltip>;
    }

    return <ValueTooltip tooltip={longText}>
      <span className="hidden-xs">
        { shortText }
      </span>
      <span className="visible-xs-inline">
        { longText }
      </span>
    </ValueTooltip>;
  }

  function TotalEvents({short, count}: {
    short?: boolean; count: number;
  }) {
    var shortText = count.toString();
    var longText = Text.events(count);
    if (short) {
      return <ValueTooltip tooltip={longText}>
        { shortText }
      </ValueTooltip>;
    }

    return <ValueTooltip tooltip={longText}>
      <span className="hidden-xs">
        { shortText }
      </span>
      <span className="visible-xs-inline">
        { longText }
      </span>
    </ValueTooltip>;
  }

  class ValueTooltip extends ReactHelpers.Component<{
    tooltip: string,
    children?: JSX.Element[]
  }, {}> {
    _elm: HTMLSpanElement;

    render() {
      return <span ref={(c) => this._elm = c} className="value"
                   title={this.props.tooltip}
                   data-original-title={this.props.tooltip}
                   data-toogle="tooltip">
        { this.props.children }
      </span>;
    }

    componentDidMount() {
      $(this._elm).tooltip();
    }

    componentDidUpdate() {
      $(this._elm).tooltip();
    }
  }
}
