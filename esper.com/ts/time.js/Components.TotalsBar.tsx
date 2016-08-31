/*
  Used with charts to show the total number of events / hours shown in chart
*/

module Esper.Components {
  interface Props {
    periodTotals: Charting.PeriodData<EventStats.Group>[];
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
                          duration={total.data.totalValue} />
            </span>
            <span className="total-count">
              <i className="fa fa-fw fa-calendar-o" />{" "}
              <TotalEvents short={totals.length > 1}
                           count={total.data.totalUnique} />
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
      return <Tooltip title={longText}>
        { shortText }
      </Tooltip>;
    }

    return <Tooltip title={longText}>
      <span className="hidden-xs">
        { shortText }
      </span>
      <span className="visible-xs-inline">
        { longText }
      </span>
    </Tooltip>;
  }

  function TotalEvents({short, count}: {
    short?: boolean; count: number;
  }) {
    var shortText = count.toString();
    var longText = Text.events(count);
    if (short) {
      return <Tooltip title={longText}>
        { shortText }
      </Tooltip>;
    }

    return <Tooltip title={longText}>
      <span className="hidden-xs">
        { shortText }
      </span>
      <span className="visible-xs-inline">
        { longText }
      </span>
    </Tooltip>;
  }
}
