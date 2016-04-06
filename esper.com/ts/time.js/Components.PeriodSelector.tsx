/*
  Component for selecting a single period give an interval type
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />

module Esper.Components {
  export class SingleOrCustomPeriodSelector extends ReactHelpers.Component<{
    id?: string;
    period: Period.Single|Period.Custom;
    updateFn: (period: Period.Single|Period.Custom) => void;
  }, {}> {
    render() {
      var period = this.props.period;
      var minDate = moment().startOf('day')
        .add(Events2.MIN_CUSTOM_INCR, 'days').toDate();
      var maxDate = moment().endOf('day')
        .add(Events2.MAX_CUSTOM_INCR, 'days').toDate();
      if (Period.isCustom(period)) {
        return <CalendarRangeSelectorDropdown
          onRangeSelect={(start, end) =>
            this.props.updateFn(Period.customFromDates(start, end))
          }
          selected={Period.boundsFromPeriod(period)}
          min={minDate}
          max={maxDate}
        />;
      } else {
        return <PeriodSelector
          id={this.props.id}
          period={period}
          updateFn={(p) => this.props.updateFn(p)}
        />;
      }
    }
  }

  export class PeriodSelector extends ReactHelpers.Component<{
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
            return [Events2.MIN_QUARTER_INCR, Events2.MAX_QUARTER_INCR]
          case "month":
            return [Events2.MIN_MONTH_INCR, Events2.MAX_MONTH_INCR]
          default: // Week
            return [Events2.MIN_WEEK_INCR, Events2.MAX_WEEK_INCR]
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
        <DropdownModal>
          <input type="text" id={this.props.id || this.getId("")}
                 className="form-control dropdown-toggle" readOnly={true}
                 value={ periodStrs[selectedIndex] } />
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
        </DropdownModal>
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

  export class PeriodSelectorWithIcon extends PeriodSelector {
    render() {
      return this.renderBase(true);
    }
  }
}
