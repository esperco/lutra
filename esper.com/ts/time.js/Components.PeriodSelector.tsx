/*
  Component for selecting interval + period
*/

module Esper.Components {
  export class PeriodSelector extends ReactHelpers.Component<{
    minDate: Date;
    maxDate: Date;
    period: Types.Period;
    updateFn: (period: Types.Period) => void;
    hintDismissed: boolean;
    isLimited?: boolean;
    onLimitClick?: () => void;
    range?: boolean;          // Range mode -> select more than one instance
    show?: Period.Interval[]; // Limit which intervals are available
  }, {}> {
    _dropdown: Dropdown;

    render() {
      var period = this.props.period;
      var selector = ((interval: Period.Interval) => {
        switch (interval) {
          case "quarter":
            return <PeriodMenu
              min={this.props.minDate}
              max={this.props.maxDate}
              interval="quarter"
              range={this.props.range}
              selected={this.props.period}
              onUpdate={(p) => this.updateAndClose(p)}
            />

          case "month":
            return <PeriodMenu
              min={this.props.minDate}
              max={this.props.maxDate}
              interval="month"
              range={this.props.range}
              selected={this.props.period}
              onUpdate={(p) => this.updateAndClose(p)}
            />

          case "week":
            return <CalendarWeekSelector
              min={this.props.minDate}
              max={this.props.maxDate}
              range={this.props.range}
              selected={Period.bounds(period)}
              onWeekSelect={(start, end) =>
                this.updateAndClose(Period.fromDates("week", start, end))
              }
            />

          default: // Custom or day
            return <CalendarRangeSelector
              min={this.props.minDate}
              max={this.props.maxDate}
              selected={Period.bounds(period)}
              onRangeSelect={(start, end) =>
                this.updateAndClose(Period.fromDates("day", start, end))
              }
            />
        }
      })(period.interval);

      // Disable left/right arrows?
      var disableLeft = this.props.range || (
        Period.bounds(Period.add(period, -1))[0].getTime() <
        this.props.minDate.getTime()
      );
      var disableRight = this.props.range || (
        Period.bounds(Period.add(period, 1))[1].getTime() >
        this.props.maxDate.getTime()
      );

      // Intervals to show in selector
      var intervals = this.props.show || (
        this.props.range ?
        ["week", "month", "quarter"] :      // No day for time series
        ["week", "month", "quarter", "day"] // "Day" = custom
      );

      return <div className="period-selector">
        { disableLeft ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.add(period, -1))}>
            <i className="fa fa-fw fa-caret-left" />
          </span> }
        <Hint className="period-list"
              text={Text.PeriodSelectorHintText}
              dismissed={this.props.hintDismissed}
              onDismiss={() => Stores.Hints.set('PeriodSelectorHint', true)}>
          <Dropdown ref={(c) => this._dropdown = c} keepOpen={true}>
            <div className="dropdown-toggle period-list-toggle">
              { Text.fmtPeriod(period) }
              <i id="period-selector"
                 className="fa fa-fw fa-right fa-caret-down" />
            </div>
            <div className="dropdown-menu">
              { intervals.length > 1 ?
                <IntervalSelector
                  selected={period.interval}
                  intervals={intervals}
                  onUpdate={(i) => this.props.updateFn(Period.now(i))}
                /> : null }
              { this.props.isLimited ?
                <div className={classNames("upgrade-alert", {
                  "action-block": !!this.props.onLimitClick
                })} onClick={() => this.onLimitClick()}>
                  { Text.CalendarPeriodUpgradeMsg }
                </div> : null
              }
              <div className="esper-select-menu">
                { selector }
              </div>
            </div>
          </Dropdown>
        </Hint>
        { disableRight ? <span /> :
          <span className="action period-incr-action"
                onClick={() => this.props.updateFn(Period.add(period, 1))}>
            <i className="fa fa-fw fa-caret-right" />
          </span> }
      </div>;
    }

    onLimitClick() {
      if (this.props.onLimitClick) {
        this.props.onLimitClick();
        this.close();
      }
    }

    close() {
      if (this._dropdown) {
        this._dropdown.close();
      }
    }

    // Update period and close menu
    updateAndClose(period: Types.Period) {
      this.props.updateFn(period);
      this.close();
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
      default: return Text.Custom;
    }
  }

  // List of links to specific periods between min and max
  interface PeriodMenuProps {
    min: Date;
    max: Date;
    interval: Types.Interval;
    selected?: Types.Period;
    range?: boolean;
    onUpdate: (period: Types.Period) => void;
  }

  class PeriodMenu extends ReactHelpers.Component<PeriodMenuProps, {
    lastSelected?: number;
    hover?: number;
  }> {
    constructor(props: PeriodMenuProps) {
      super(props);
      this.state = {};
    }

    render() {
      let { min, max, interval, selected, onUpdate } = this.props;
      let { start, end } = Period.fromDates(interval, min, max);
      let range = _.orderBy(_.range(start, end + 1), _.identity, 'desc');

      return <ul className="esper-select-menu">{_.map( range, (r) =>
        <li key={r} onClick={() => this.select(r)}
            onMouseOver={() => this.updateHover(r, true)}
            onMouseOut={() => this.updateHover(r, false)}>
          <a className={classNames({ active: this.isHighlighted(r) })}>
            { Text.fmtPeriod({
              interval: this.props.interval,
              start: r, end: r
            }) }
          </a>
        </li>
      )}</ul>;
    }

    select(index: number) {
      if (this.props.range) {
        if (_.isNumber(this.state.lastSelected) &&
            index > this.state.lastSelected) {
          this.props.onUpdate({
            interval: this.props.interval,
            start: this.state.lastSelected,
            end: index
          });
        } else {
          this.setState({
            lastSelected: index,
            hover: this.state.hover
          });
        }
      } else {
        this.props.onUpdate({
          interval: this.props.interval,
          start: index,
          end: index
        });
      }
    }

    isHighlighted(index: number) {
      // There's a previous selection, highlight if greater than last and less
      // than hover
      if (_.isNumber(this.state.lastSelected)) {
        if (_.isNumber(this.state.hover)) {
          return index >= this.state.lastSelected && index <= this.state.hover;
        }
        return index === this.state.lastSelected;
      }

      // No selection -- highlight if currently selected
      return index === this.state.lastSelected ||
             (index >= this.props.selected.start &&
              index <= this.props.selected.end);
    }

    updateHover(index: number, hoverState: boolean) {
      // Don't unset hover if not what you think it is
      if (!hoverState && this.state.hover !== index) {
        return;
      }

      this.setState({
        lastSelected: this.state.lastSelected,
        hover: hoverState ? index : null
      });
    }
  }
}
