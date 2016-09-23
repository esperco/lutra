/*
  Component for selecting interval + period
*/

module Esper.Components {
  export class PeriodSelector extends ReactHelpers.Component<{
    period: Types.Period;
    updateFn: (period: Types.Period) => void;
    show?: Period.Interval[]; // Limit which intervals are available
  }, {}> {
    _dropdown: Dropdown;

    render() {
      var period = this.props.period;
      var selector = ((interval: Period.Interval) => {
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
              selected={Period.bounds(period)}
              onWeekSelect={(start, end) =>
                this.updateAndClose(Period.fromDates("week", start, end))
              }
            />

          default: // Custom or day
            return <CalendarRangeSelector
              min={Config.MIN_DATE}
              max={Config.MAX_DATE}
              selected={Period.bounds(period)}
              onRangeSelect={(start, end) =>
                this.updateAndClose(Period.fromDates("day", start, end))
              }
            />
        }
      })(period.interval);

      // Disable left/right arrows?
      var disableLeft = (
        Period.bounds(Period.add(period, -1))[0].getTime() <
        Config.MIN_DATE.getTime()
      );
      var disableRight = (
        Period.bounds(Period.add(period, 1))[1].getTime() >
        Config.MAX_DATE.getTime()
      );

      // Intervals to show in selector
      var intervals = this.props.show || ["day", "week", "month", "quarter"];

      return <div className="period-selector">
        { disableLeft ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.add(period, -1))}>
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
                onUpdate={(i) => this.props.updateFn(Period.now(i))}
              /> : null }
            <div className="esper-select-menu">
              { selector }
            </div>
          </div>
        </Dropdown>
        { disableRight ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.add(period, 1))}>
            <i className="fa fa-fw fa-caret-right" />
          </span> }
      </div>;
    }

    // Update period and close menu
    updateAndClose(period: Types.Period) {
      this.props.updateFn(period);
      if (this._dropdown) {
        this._dropdown.close();
      }
    }
  }

  // List of links to change interval
  function IntervalSelector({selected, intervals, onUpdate} : {
    selected?: Period.Interval;
    intervals: Period.Interval[];
    onUpdate: (period: Period.Interval) => void;
  }) {
    return <div className="esper-select-menu esper-flex-list interval-selector">
      { _.map(intervals, (i) =>
        <a key={i} className={classNames("esper-selectable text-center", {
          active: selected === i
        })} onClick={() => onUpdate(i)}>
          { textForInterval(i) }
        </a>
      )}
    </div>;
  }

  function textForInterval(interval: Period.Interval) {
    switch(interval) {
      case "week": return Text.Week;
      case "month": return Text.Month;
      case "quarter": return Text.Quarter;
      default: return Text.Day;
    }
  }

  // List of links to specific periods between min and max
  function PeriodMenu({min, max, interval, selected, onUpdate} : {
    min: Date;
    max: Date;
    interval: Types.Interval;
    selected?: Types.Period;
    onUpdate: (period: Types.Period) => void;
  }) {
    var periods: Types.Period[] = [];
    var m = moment(min);
    while (m.diff(max) < 0) {
      periods.push(Period.fromDates(interval, m.toDate(), m.toDate()));
      m.add(1, interval);
    }
    return <ul className="esper-select-menu">{_.map( periods, (p) =>
      <li key={p.start} onClick={() => onUpdate(p)}>
        <a className={_.isEqual(selected, p) ? "active" : "" }>
          { Text.fmtPeriod(p) }
        </a>
      </li>
    )}</ul>;
  }


  /* Below components are deprecated */

  class OldPeriodSelector extends ReactHelpers.Component<{
    id?: string;
    period: Types.Period;
    updateFn: (period: Types.Period) => void;
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

      var current = Period.now(interval).start;
      var minIndex = current + minMax[0];
      var maxIndex = current + minMax[1];

      var periodStrs = _.map(
        _.range(minIndex, maxIndex + 1),
        (index) => Text.fmtPeriod({
          interval: interval,
          start: index,
          end: index
        })
      );

      var selectedIndex = this.props.period.start - minIndex;
      var disableLeft = this.props.period.start <= minIndex;
      var disableRight = this.props.period.start >= maxIndex;

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
                      start: minIndex + i,
                      end: minIndex + i
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
                start: this.props.period.start - 1,
                end: this.props.period.end - 1
              })}>
            <i className="fa fa-fw fa-caret-left" />
          </button>
          <button type="button" className={"btn btn-default"}
              disabled={disableRight}
              onClick={() => this.props.updateFn({
                interval: this.props.period.interval,
                start: this.props.period.start + 1,
                end: this.props.period.end + 1
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
