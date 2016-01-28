/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.CalendarGrid.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Charts {

  /*
    Base class for calendar grid-style Autochart
  */
  export abstract class CalendarGridChart extends AutoChart {
    static displayName = "Calendar Grid";

    renderChart() {
      return <Components.CalendarGrid
        date={this.params.windowStart}
        dayFn={this.dayFn.bind(this)}
      />;
    }

    noData() {
      // Always show grid if there's an API response, even if empty
      return !this.sync()[0];
    }

    protected abstract dayFn(m: moment.Moment): JSX.Element;

    // Use a simple month selector rather than allow custom periods
    renderPeriodSelector(updateFn: (req: TimeStats.RequestPeriod) => void) {
      var start = moment(TimeStats.MIN_DATE).startOf('month');
      var end = moment(TimeStats.MAX_DATE).endOf('month');
      var months: [moment.Moment, moment.Moment][] = [];

      while (start < end) {
        months.push([start.clone(), start.clone().endOf('month')]);
        start.add(1, 'month');
      }

      var selected = _.findIndex(months, (m) =>
        this.params.windowStart >= m[0].toDate() &&
        this.params.windowStart <= m[1].toDate()
      ) || 0;

      var disableLeft = selected <= 0;
      var disableRight = selected >= months.length - 1;

      var updateTo = function(i: number) {
        var pair = months[i];
        if (pair) {
          updateFn({
            windowStart: pair[0].toDate(),
            windowEnd: pair[1].toDate()
          });
        }
      }

      var onChange = (event: React.SyntheticEvent) => {
        var target = event.target as HTMLSelectElement;
        updateTo(parseInt(target.value));
      };

      return (<div className="row">
        <div className="col-xs-9">
          <select value={selected ? selected.toString() : ""}
            className="form-control" onChange={onChange}>
            { _.map(months, (p, i) =>
              <option key={i} value={i.toString()}>
                { p[0].format("MMMM YYYY") }
              </option>
            )}
          </select>
        </div>
        <div className="btn-group col-xs-3">
          <button type="button" className={"btn btn-default" + (
              disableLeft ? " disabled" : "")}
              onClick={() => updateTo(selected - 1)}>
            <i className="fa fa-fw fa-caret-left" />
          </button>
          <button type="button" className={"btn btn-default" + (
              disableLeft ? " disabled" : "")}
              onClick={() => updateTo(selected + 1)}>
            <i className="fa fa-fw fa-caret-right" />
          </button>
        </div>
      </div>);
    }
  }
}
