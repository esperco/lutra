/*
  Component for selecting a month
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />

module Esper.Components {
  export class MonthSelector extends ReactHelpers.Component<{
    id?: string;
    windowStart: Date;
    windowEnd: Date;
    updateFn: (req: TimeStats.RequestPeriod) => void;
  }, {}> {

    render() {
      var start = moment(TimeStats.MIN_DATE).startOf('month');
      var end = moment(TimeStats.MAX_DATE).endOf('month');
      var months: [moment.Moment, moment.Moment][] = [];

      while (start < end) {
        months.push([start.clone(), start.clone().endOf('month')]);
        start.add(1, 'month');
      }

      var selected = _.findIndex(months, (m) =>
        this.props.windowStart >= m[0].toDate() &&
        this.props.windowEnd <= m[1].toDate()
      ) || 0;

      var disableLeft = selected <= 0;
      var disableRight = selected >= months.length - 1;

      var updateTo = (i: number) => {
        var pair = months[i];
        if (pair) {
          this.props.updateFn({
            windowStart: pair[0].toDate(),
            windowEnd: pair[1].toDate()
          });
        }
      }

      return <div className="input-group month-selector">
        <span className="input-group-addon">
          <i className="fa fa-fw fa-clock-o" />
        </span>
        <DropdownModal>
          <input type="text" id={this.props.id || this.getId("")}
                 className="form-control dropdown-toggle" readOnly={true}
                 value={ months[selected || 0][0].format("MMMM YYYY") } />
          <ul className="dropdown-menu">
            {
              _.map(months, (p, i) =>
                <li key={i} onClick={() => updateTo(i)}>
                  <a>{ p[0].format("MMMM YYYY") }</a>
                </li>
              )
            }
          </ul>
        </DropdownModal>
        <div className="input-group-btn">
          <button type="button" className={"btn btn-default" + (
              disableLeft ? " disabled" : "")}
              onClick={() => updateTo(selected - 1)}>
            <i className="fa fa-fw fa-caret-left" />
          </button>
          <button type="button" className={"btn btn-default" + (
              disableRight ? " disabled" : "")}
              onClick={() => updateTo(selected + 1)}>
            <i className="fa fa-fw fa-caret-right" />
          </button>
        </div>
      </div>;
    }
  }
}
