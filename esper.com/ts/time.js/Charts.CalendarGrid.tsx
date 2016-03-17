/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.CalendarGrid.tsx" />
/// <reference path="./Components.MonthSelector.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Charts {

  /*
    Base class for calendar grid-style Autochart
  */
  export abstract class CalendarGridChart extends AutoChart<Charts.ChartJSON> {
    renderChart() {
      return <Components.CalendarGrid
        date={new Date(this.params.start)}
        dayFn={this.dayFn.bind(this)}
      />;
    }

    noData() {
      // Always show grid if there's an API response, even if empty
      return !this.sync()[0];
    }

    protected abstract dayFn(m: moment.Moment): JSX.Element;

    // Use a simple month selector rather than allow custom periods
    renderPeriodSelector() {
      return <Components.MonthSelector
        windowStart={new Date(this.params.start)}
        windowEnd={new Date(this.params.end)}
        updateFn={(x) => this.updatePeriod(x)}
      />;
    }
  }
}
