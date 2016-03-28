/*
  Component for selecting a month
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />
/// <reference path="./Events2.ts" />

module Esper.Components {
  export class PeriodSelector extends ReactHelpers.Component<{
    id?: string;
    period: Period.Single;
    updateFn: (period: Period.Single) => void;
  }, {}> {

    render() {
      var interval = this.props.period.interval;
      var intervalProps = ((interval: Period.Interval) => {
        var current = Period.current(interval).index;
        switch (interval) {
          case "quarter":
            return {
              min: current + Events2.MIN_QUARTER_INCR,
              max: current + Events2.MAX_QUARTER_INCR,
              str: (start: moment.Moment) => start.format("[Q]Q YYYY")
            };
          case "month":
            return {
              min: current + Events2.MIN_MONTH_INCR,
              max: current + Events2.MAX_MONTH_INCR,
              str: (start: moment.Moment) => start.format("MMMM YYYY")
            };
          default: // Week
            return {
              min: current + Events2.MIN_WEEK_INCR,
              max: current + Events2.MAX_WEEK_INCR,
              str: (start: moment.Moment) => start.format("[Week of] MMM D")
            };
        }
      })(interval);

      var start = moment(Period.boundsFromPeriod({
        interval: interval,
        index: intervalProps.min
      })[0]);
      var index = intervalProps.min;
      var periodStrs: string[] = [];

      while (index <= intervalProps.max) {
        periodStrs.push(intervalProps.str(start));
        start.add(1, interval);
        index += 1;
      }

      var selectedIndex = this.props.period.index - intervalProps.min;
      var disableLeft = this.props.period.index <= intervalProps.min;
      var disableRight = this.props.period.index >= intervalProps.max;

      return <div className="input-group month-selector">
        <span className="input-group-addon">
          <i className="fa fa-fw fa-clock-o" />
        </span>
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
                      index: intervalProps.min + i
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
}
