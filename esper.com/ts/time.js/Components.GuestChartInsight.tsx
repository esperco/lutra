/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class GuestChartInsight extends ChartGroupingInsight<{}> {
    /*
      This is a bar chart with labels on the side. So don't need to summarize
      too much.
    */

    renderMain(groups: Charting.PeriodOptGroup[]) {
      // Current group only
      let periodGroup = _.find(groups, (g) => g.current);
      if (! periodGroup) return <span />;

      let noGuests =
        periodGroup.data.totalUnique === periodGroup.data.none.totalUnique;

      return <div>
        { noGuests ? <p>{ Text.ChartNoGuests }</p> : null }
      </div>;
    }
  }
}
