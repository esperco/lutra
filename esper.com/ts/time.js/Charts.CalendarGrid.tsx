/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.CalendarGrid.tsx" />
/// <reference path="./Components.MonthSelector.tsx" />
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
      this.params.windowStart
      return <Components.MonthSelector
        windowStart={this.params.windowStart}
        windowEnd={this.params.windowEnd}
        updateFn={updateFn}
      />;
    }
  }
}
