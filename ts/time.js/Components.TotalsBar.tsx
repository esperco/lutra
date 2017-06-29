/*
  Used with charts to show the total number of events / hours shown in chart
*/

module Esper.Components {
  export class TotalsBar
         extends ReactHelpers.Component<Types.EventWeights, {}> {
    render() {
      return <div className="totals-bar"><div className="period-total">
        <span className="period-desc">Total</span>
        <span className="total-hours">
          <i className="fa fa-fw fa-left fa-clock-o" />
          <span>
            { Text.hours(EventStats.toHours(this.props.totalValue)) }
          </span>
        </span>
        <span className="total-count">
          <i className="fa fa-fw fa-left fa-calendar-o" />{" "}
          <span>{ Text.events(this.props.totalUnique) }</span>
        </span>
      </div></div>;
    }
  }
}
