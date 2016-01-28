/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.CalendarGrid.tsx" />

module Esper.Charts {

  /*
    Base class for calendar grid-style Autochart
  */
  export class CalendarGridChart extends AutoChart {
    static displayName = "Calendar Grid";

    renderChart() {
      return <Components.CalendarGrid
        date={new Date()}
        dayFn={this.dayFn.bind(this)}
      />;
    }

    dayFn(m: moment.Moment) {
      return <div>
        Hello
      </div>;
    }
  }
}
