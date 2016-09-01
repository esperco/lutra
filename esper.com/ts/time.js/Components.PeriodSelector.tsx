/*
  Component for selecting interval + period
*/

module Esper.Components {
  export class PeriodSelector extends ReactHelpers.Component<{
    period: Period.Single|Period.Custom;
    updateFn: (period: Period.Single|Period.Custom) => void;
    show?: Period.IntervalOrCustom[]; // Limit which intervals are available
  }, {}> {
    _dropdown: Dropdown;

    render() {
      var period = this.props.period;
      var selector = ((interval: Period.IntervalOrCustom) => {
        switch (interval) {
          case "quarter":
            return <PeriodMenu
              min={Config.MIN_DATE}
              max={Config.MAX_DATE}
              interval="quarter"
              selected={this.props.period}
              onUpdate={(p) => this.updateAndClose(p)}
            />

          case "month":
            return <PeriodMenu
              min={Config.MIN_DATE}
              max={Config.MAX_DATE}
              interval="month"
              selected={this.props.period}
              onUpdate={(p) => this.updateAndClose(p)}
            />

          case "week":
            return <CalendarWeekSelector
              min={Config.MIN_DATE}
              max={Config.MAX_DATE}
              selected={Period.boundsFromPeriod(period)}
              onWeekSelect={(start, end) =>
                this.updateAndClose(Period.singleFromDate("week", start))
              }
            />

          default: // Custom
            return <CalendarRangeSelector
              min={Config.MIN_DATE}
              max={Config.MAX_DATE}
              selected={Period.boundsFromPeriod(period)}
              onRangeSelect={(start, end) =>
                this.updateAndClose(Period.customFromDates(start, end))
              }
            />
        }
      })(period.interval);

      // Disable left/right arrows?
      var disableLeft = (
        Period.boundsFromPeriod(Period.incr(period, -1))[0].getTime() <
        Config.MIN_DATE.getTime()
      );
      var disableRight = (
        Period.boundsFromPeriod(Period.incr(period, -1))[0].getTime() >
        Config.MAX_DATE.getTime()
      );

      // Intervals to show in selector
      var intervals = this.props.show ||
        ["week", "month", "quarter", "custom"];

      return <div className="period-selector">
        { disableLeft ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.incr(period, -1))}>
            <i className="fa fa-fw fa-caret-left" />
          </span> }
        <Dropdown ref={(c) => this._dropdown = c} keepOpen={true}>
          <div className="dropdown-toggle">
            { Text.fmtPeriod(period) }
            <i className="fa fa-fw fa-right fa-caret-down" />
          </div>
          <div className="dropdown-menu">
            { intervals.length > 1 ?
              <IntervalSelector
                selected={period.interval}
                intervals={intervals}
                onUpdate={(i) => this.props.updateFn(Period.current(i))}
              /> : null }
            <div className="esper-select-menu">
              { selector }
            </div>
          </div>
        </Dropdown>
        { disableRight ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.incr(period, -1))}>
            <i className="fa fa-fw fa-caret-right" />
          </span> }
      </div>;
    }

    // Update period and close menu
    updateAndClose(period: Period.Single|Period.Custom) {
      this.props.updateFn(period);
      if (this._dropdown) {
        this._dropdown.close();
      }
    }
  }

  // List of links to change interval
  function IntervalSelector({selected, intervals, onUpdate} : {
    selected?: Period.IntervalOrCustom;
    intervals: Period.IntervalOrCustom[];
    onUpdate: (period: Period.IntervalOrCustom) => void;
  }) {
    return <div className="esper-select-menu esper-flex-list">
      { _.map(intervals, (i) =>
        <a key={i} className={classNames("esper-selectable text-center", {
          active: selected === i
        })} onClick={() => onUpdate(i)}>
          { textForInterval(i) }
        </a>
      )}
    </div>;
  }

  function textForInterval(interval: Period.IntervalOrCustom) {
    switch(interval) {
      case "week": return Text.Week;
      case "month": return Text.Month;
      case "quarter": return Text.Quarter;
      default: return Text.Custom;
    }
  }

  // List of links to specific periods between min and max
  function PeriodMenu({min, max, interval, selected, onUpdate} : {
    min: Date;
    max: Date;
    interval: Period.Interval;
    selected?: Period.Single|Period.Custom;
    onUpdate: (period: Period.Single) => void;
  }) {
    var periods: Period.Single[] = [];
    var m = moment(min);
    while (m.diff(max) < 0) {
      periods.push(Period.singleFromDate(interval, m.toDate()));
      m.add(1, interval);
    }
    return <ul className="esper-select-menu">{_.map( periods, (p) =>
      <li key={p.index} onClick={() => onUpdate(p)}>
        <a className={_.isEqual(selected, p) ? "active" : "" }>
          { Text.fmtPeriod(p) }
        </a>
      </li>
    )}</ul>;
  }


  /* Below components are deprecated */

  class OldPeriodSelector extends ReactHelpers.Component<{
    id?: string;
    period: Period.Single;
    updateFn: (period: Period.Single) => void;
  }, {}> {

    render() {
      return this.renderBase(false);
    }

    renderBase(showIcon?: boolean) {
      var interval = this.props.period.interval;
      var minMax = ((interval: Period.Interval) => {
        switch (interval) {
          case "quarter":
            return [Config.MIN_QUARTER_INCR, Config.MAX_QUARTER_INCR]
          case "month":
            return [Config.MIN_MONTH_INCR, Config.MAX_MONTH_INCR]
          default: // Week
            return [Config.MIN_WEEK_INCR, Config.MAX_WEEK_INCR]
        }
      })(interval);

      var current = Period.current(interval).index;
      var minIndex = current + minMax[0];
      var maxIndex = current + minMax[1];

      var periodStrs = _.map(
        _.range(minIndex, maxIndex + 1),
        (index) => Text.fmtPeriod({
          interval: interval,
          index: index
        })
      );

      var selectedIndex = this.props.period.index - minIndex;
      var disableLeft = this.props.period.index <= minIndex;
      var disableRight = this.props.period.index >= maxIndex;

      return <div className="input-group month-selector">
        { showIcon ?
          <span className="input-group-addon">
            <i className="fa fa-fw fa-clock-o" />
          </span> :
          null
        }
        <Dropdown>
          <Selector id={this.props.id || this.getId("")}
                    className="dropdown-toggle">
            { periodStrs[selectedIndex] }
          </Selector>
          <ul className="dropdown-menu">
            {
              _.map(periodStrs, (p, i) =>
                <li key={p}
                    onClick={() => this.props.updateFn({
                      interval: this.props.period.interval,
                      index: minIndex + i
                    })}>
                  <a>{ p }</a>
                </li>
              )
            }
          </ul>
        </Dropdown>
        <div className="input-group-btn">
          <button type="button" className={"btn btn-default"}
              disabled={disableLeft}
              onClick={() => this.props.updateFn({
                interval: this.props.period.interval,
                index: this.props.period.index - 1
              })}>
            <i className="fa fa-fw fa-caret-left" />
          </button>
          <button type="button" className={"btn btn-default"}
              disabled={disableRight}
              onClick={() => this.props.updateFn({
                interval: this.props.period.interval,
                index: this.props.period.index + 1
              })}>
            <i className="fa fa-fw fa-caret-right" />
          </button>
        </div>
      </div>;
    }
  }

  export class PeriodSelectorWithIcon extends OldPeriodSelector {
    render() {
      return this.renderBase(true);
    }
  }
}
